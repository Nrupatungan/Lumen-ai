// Document Deletion Worker: cleans up Pinecone, S3, Mongo, Redis (idempotent)

import { SQSEvent } from "aws-lambda";
import { deleteObject } from "@repo/aws";
import { DocumentModel, DocumentChunk, IngestionJob } from "@repo/db";
import { expireJob, invalidateDocuments } from "@repo/cache";
import { logger } from "@repo/observability";
import { getUserPlan } from "@repo/policy";
import { createRagClients } from "@repo/rag-core";

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const { documentId, userId, s3Key } = JSON.parse(record.body);
    const plan = await getUserPlan(userId);
    const { vectorStore } = createRagClients(plan)

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
      await invalidateDocuments(documentId);

      logger.info("Document deleted successfully", { documentId });
    } catch (error) {
      logger.error("Document deletion failed", { error, documentId });

      // IMPORTANT: do NOT rethrow
      // deletion worker must be idempotent and non-blocking
    }
  }
};
