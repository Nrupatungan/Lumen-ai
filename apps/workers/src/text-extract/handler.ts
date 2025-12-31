import { SQSEvent } from "aws-lambda";
import { Readable } from "node:stream";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  invalidateDocumentStatus,
  publishJobUpdate,
  setJobProgress,
  setJobStage,
  setJobStatus,
} from "@repo/cache";
import { sendMessage, getObjectStream } from "@repo/aws";
import { TextExtractMessage, ChunkEmbedMessage } from "@repo/queue";
import { DocumentModel, IngestionJob } from "@repo/db";
import { logger } from "@repo/observability";

// LangChain loaders (strategy only – minimal refactor)
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { marked } from "marked";

async function streamToTempFile(stream: Readable, filename: string) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ingest-"));
  const filePath = path.join(tmpDir, filename);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  await fs.writeFile(filePath, Buffer.concat(chunks));
  return filePath;
}

function stripHtmlTags(extractHtml: string): string {
  return extractHtml.replace(/<[^>]*>/g, ""); // Remove HTML tags
}

function getLoader(sourceType: string, filePath: string) {
  switch (sourceType) {
    case "pdf":
      return new PDFLoader(filePath);
    case "text":
      return new TextLoader(filePath);
    case "docx":
      return new DocxLoader(filePath);
    case "pptx":
      return new PPTXLoader(filePath);
    case "epub":
      return new EPubLoader(filePath);
    default:
      return null;
  }
}

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    let payload: TextExtractMessage;

    try {
      payload = JSON.parse(record.body);
    } catch (error) {
      logger.error("Invalid SQS message body", { error });
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { jobId, documentId, userId, s3Key, sourceType } = payload as any;

    try {
      // Redis: start extraction stage
      await setJobStatus(jobId, "processing");
      await setJobStage(jobId, "extracting_text");
      await setJobProgress(jobId, 10);
      await publishJobUpdate(jobId, { stage: "extracting_text", progress: 10 });
      await invalidateDocumentStatus(documentId);

      // 1. Download file from S3 (same behavior as before)
      const stream = await getObjectStream(process.env.S3_BUCKET_NAME!, s3Key);

      const filePath = await streamToTempFile(stream, path.basename(s3Key));

      await setJobProgress(jobId, 30);
      await publishJobUpdate(jobId, { stage: "extracting_text", progress: 30 });

      // 2. Extract text using loader strategy
      let extractedText = "";

      if (sourceType === "markdown") {
        const raw = await fs.readFile(filePath, "utf8");
        const extractHtml = await marked.parse(raw);
        extractedText = stripHtmlTags(extractHtml);
      } else {
        const loader = getLoader(sourceType, filePath);
        if (!loader) {
          throw new Error(`Unsupported sourceType: ${sourceType}`);
        }
        const docs = await loader.load();
        extractedText = docs.map((d) => d.pageContent).join("\n");
      }

      if (!extractedText.trim()) {
        throw new Error("No extractable text found in document");
      }

      await setJobProgress(jobId, 60);
      await publishJobUpdate(jobId, { stage: "extracting_text", progress: 60 });

      // 3. Forward extracted text to chunk + embed (unchanged)
      const nextMessage: ChunkEmbedMessage = {
        jobId,
        documentId,
        userId,
        textLocation: {
          type: "inline",
          value: extractedText,
        },
      };

      await sendMessage(process.env.CHUNK_EMBED_QUEUE_URL!, nextMessage);

      await setJobStage(jobId, "text_extracted");
      await setJobProgress(jobId, 80);
      await publishJobUpdate(jobId, { stage: "text_extracted", progress: 80 });

      logger.info("Text extraction completed", { jobId, documentId });
    } catch (error) {
      logger.error("Text extraction failed", { error, jobId, documentId });

      // Mongo: authoritative failure state
      await IngestionJob.findByIdAndUpdate(jobId, {
        status: "failed",
        error: String(error),
      });

      await DocumentModel.findByIdAndUpdate(documentId, {
        status: "failed",
      });

      // Redis: best-effort failure state
      await setJobStatus(jobId, "failed");
      await setJobStage(jobId, "text_extraction_failed");
      await publishJobUpdate(jobId, {
        stage: "failed",
        error: String(error),
      });
      await invalidateDocumentStatus(documentId);
    }
  }
};
