import { SQSEvent } from "aws-lambda";
import { DocumentModel, IngestionJob } from "@repo/db";
import { invalidateDocumentStatus, setJobStage, setJobStatus } from "@repo/cache";
import { sendMessage } from "@repo/aws";
import {
  DocumentIngestMessage,
  TextExtractMessage,
  OCRMessage,
} from "@repo/queue";
import { logger } from "@repo/observability";
import { PLAN_POLICY, getUserPlan } from "@repo/policy";

const TEXT_EXTRACT_SOURCES = ["pdf", "docx", "pptx", "epub", "md", "txt"];

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    let payload: DocumentIngestMessage;

    try {
      payload = JSON.parse(record.body);
    } catch (err) {
      logger.error("Invalid SQS message body", { err });
      continue;
    }

    const { jobId, documentId, userId, sourceType, s3Key } = payload;

    try {
      // 1. Resolve plan & policy
      const plan = await getUserPlan(userId);
      const policy = PLAN_POLICY[plan];

      // 2. Authoritative Mongo state
      await IngestionJob.findByIdAndUpdate(jobId, { status: "processing" });
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: "processing",
      });

      await invalidateDocumentStatus(documentId);

      // 3. Redis (best-effort)
      await setJobStatus(jobId, "processing");
      await setJobStage(jobId, "routing");

      // 4. OCR sources (policy gated)
      if (sourceType === "image") {
        if (!policy.ingestion.ocr) {
          await setJobStatus(jobId, "failed");
          await setJobStage(jobId, "blocked");

          await invalidateDocumentStatus(documentId);

          logger.warn("Ingestion blocked by plan policy", {
            jobId,
            documentId,
            userId,
            plan,
            sourceType,
          });

          return;
        }

        const msg: OCRMessage = { jobId, documentId, userId, s3Key };

        await setJobStage(jobId, "ocr");
        
        await sendMessage(process.env.OCR_EXTRACT_QUEUE_URL!, msg);

        await invalidateDocumentStatus(documentId);
        
        logger.info("Routed to OCR pipeline", { jobId, documentId });
        continue;
      }

      // 5. Text-based sources → text-extract
      if (TEXT_EXTRACT_SOURCES.includes(sourceType)) {
        const msg: TextExtractMessage = {
          jobId,
          documentId,
          userId,
          s3Key,
        };

        await setJobStage(jobId, "extracting_text");

        await sendMessage(process.env.TEXT_EXTRACT_QUEUE_URL!, msg);
        
        await invalidateDocumentStatus(documentId);

        logger.info("Routed to text extraction pipeline", {
          jobId,
          documentId,
          sourceType,
        });

        continue;
      }

      // 6. Unsupported source
      throw new Error(`Unsupported source type: ${sourceType}`);
    } catch (error) {
      logger.error("Ingestion routing failed", { error, jobId, documentId });

      await IngestionJob.findByIdAndUpdate(jobId, {
        status: "failed",
        error: String(error),
      });

      await DocumentModel.findByIdAndUpdate(documentId, { status: "failed" });
      
      await setJobStatus(jobId, "failed");
      await setJobStage(jobId, "routing_failed");
      await invalidateDocumentStatus(documentId);
    }
  }
};
