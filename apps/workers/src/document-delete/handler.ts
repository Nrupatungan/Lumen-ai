import { SQSEvent } from "aws-lambda";
import { deleteObject } from "@repo/aws";
import { connectDB, DocumentModel, IngestionJob } from "@repo/db";
import { expireJob, invalidateDocuments } from "@repo/cache";
import { logger } from "@repo/observability";
import { getUserPlan } from "@repo/policy/utils";
import { createRagClients } from "@repo/rag-core";

const URI = String(process.env.MONGO_URI);
const DB_NAME = String(process.env.MONGO_DB_NAME);

export const handler = async (event: SQSEvent) => {
  await connectDB(URI, DB_NAME);

  for (const record of event.Records) {
    const { documentId, userId, s3Key } = JSON.parse(record.body);
    const plan = await getUserPlan(userId);
    const { vectorStore } = createRagClients(plan);

    try {
      // 1. Delete vectors by metadata filter
      await vectorStore.delete({
        filter: { documentId, userId },
      });

      // 2. Delete raw file from S3
      if (s3Key) {
        await deleteObject(process.env.S3_BUCKET_NAME!, s3Key);
      }

      // 3. Delete Mongo records
      await IngestionJob.deleteMany({ documentId });
      await DocumentModel.findOneAndDelete({
        _id: documentId,
        userId,
      });

      // 4. Cleanup Redis
      await expireJob(documentId);
      await invalidateDocuments(userId);

      logger.info("Document deleted successfully", { documentId });
    } catch (error) {
      logger.error("Document deletion failed", { error, documentId });

      // IMPORTANT: do NOT rethrow
      // deletion worker must be idempotent and non-blocking
    }
  }
};
