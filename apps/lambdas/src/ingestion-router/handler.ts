import { SQSEvent } from "aws-lambda";
import { connectDB, DocumentModel, IngestionJob } from "@repo/db";
import {
  invalidateDocumentStatusRest,
  setJobStageRest,
  setJobStatusRest,
} from "@repo/cache/rest";
import { sendMessage } from "@repo/aws";
import {
  DocumentIngestMessage,
  TextExtractMessage,
  OCRMessage,
} from "@repo/queue";
import { PLAN_POLICY } from "@repo/policy-node";
import { getUserPlan } from "@repo/db";
import { loadConfig } from "../utils/cachedConfig.js";

const TEXT_EXTRACT_SOURCES = ["pdf", "docx", "pptx", "epub", "md", "txt"];

export const handler = async (event: SQSEvent) => {
  const { MONGO_URI, URL, TOKEN } = await loadConfig();

  await connectDB(MONGO_URI, process.env.MONGO_DB_NAME!);

  for (const record of event.Records) {
    let payload: DocumentIngestMessage;

    try {
      payload = JSON.parse(record.body);
    } catch (err) {
      console.error("Invalid SQS message body", { err });
      continue;
    }

    const { jobId, documentId, userId, sourceType, s3Key } = payload;

    try {
      // 1. Resolve plan & policy
      const plan = await getUserPlan(userId);
      const policy = PLAN_POLICY[plan];

      // 2. Authoritative Mongo state
      await IngestionJob.findOneAndUpdate(
        { _id: jobId, status: { $ne: "completed" } },
        { status: "processing" },
      );
      await DocumentModel.findOneAndUpdate(
        { _id: documentId, status: { $ne: "ready" } },
        { status: "processing" },
      );

      await invalidateDocumentStatusRest(documentId, URL, TOKEN);

      // 3. Redis (best-effort)
      await setJobStatusRest(jobId, "processing", URL, TOKEN);
      await setJobStageRest(jobId, "routing", URL, TOKEN);

      // 4. OCR sources (policy gated)
      if (sourceType === "image") {
        if (!policy.ingestion.ocr) {
          await setJobStatusRest(jobId, "failed", URL, TOKEN);
          await setJobStageRest(jobId, "blocked", URL, TOKEN);

          await invalidateDocumentStatusRest(documentId, URL, TOKEN);

          console.warn("Ingestion blocked by plan policy", {
            jobId,
            documentId,
            userId,
            plan,
            sourceType,
          });

          return;
        }

        const msg: OCRMessage = { jobId, documentId, userId, s3Key };

        await setJobStageRest(jobId, "ocr", URL, TOKEN);

        await sendMessage(process.env.OCR_EXTRACT_QUEUE_URL!, msg);

        await invalidateDocumentStatusRest(documentId, URL, TOKEN);

        console.info("Routed to OCR pipeline", { jobId, documentId });
        continue;
      }

      // 5. Text-based sources → text-extract
      if (TEXT_EXTRACT_SOURCES.includes(sourceType)) {
        const msg: TextExtractMessage = {
          jobId,
          documentId,
          userId,
          s3Key,
          sourceType,
        };

        await setJobStageRest(jobId, "extracting_text", URL, TOKEN);

        await sendMessage(process.env.TEXT_EXTRACT_QUEUE_URL!, msg);

        await invalidateDocumentStatusRest(documentId, URL, TOKEN);

        console.info("Routed to text extraction pipeline", {
          jobId,
          documentId,
          sourceType,
        });

        continue;
      }

      // 6. Unsupported source
      throw new Error(`Unsupported source type: ${sourceType}`);
    } catch (error) {
      console.error("Ingestion routing failed", {
        error,
        jobId,
        documentId,
      });

      await IngestionJob.findByIdAndUpdate(jobId, {
        status: "failed",
        error: String(error),
      });

      await DocumentModel.findByIdAndUpdate(documentId, { status: "failed" });

      await setJobStatusRest(jobId, "failed", URL, TOKEN);
      await setJobStageRest(jobId, "routing_failed", URL, TOKEN);
      await invalidateDocumentStatusRest(documentId, URL, TOKEN);
    }
  }
};
