// Document Deletion Worker: cleans up Pinecone, S3, Mongo, Redis (idempotent)

import { SQSEvent } from "aws-lambda";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { deleteObject } from "@repo/aws";
import { DocumentModel, DocumentChunk, IngestionJob } from "@repo/db";
import { expireJob } from "@repo/cache";
import { logger } from "@repo/observability";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pineconeClient = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX!);

const vectorStore = new PineconeStore(embeddings, {
  pineconeIndex,
});

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const { documentId, userId, s3Key } = JSON.parse(record.body);

    try {
      // 1. Delete vectors by metadata filter
      await vectorStore.delete({
        filter: { documentId, userId },
      });

      // 2. Delete raw file from S3
      if (s3Key) {
        await deleteObject(process.env.S3_BUCKET_NAME!, s3Key);
      }

      // 3. Delete Mongo records (order matters)
      await DocumentChunk.deleteMany({ documentId });
      await IngestionJob.deleteMany({ documentId });
      await DocumentModel.deleteOne({ _id: documentId });

      // 4. Cleanup Redis (best-effort)
      await expireJob(documentId);

      logger.info("Document deleted successfully", { documentId });
    } catch (error) {
      logger.error("Document deletion failed", { error, documentId });

      // IMPORTANT: do NOT rethrow
      // deletion worker must be idempotent and non-blocking
    }
  }
};
