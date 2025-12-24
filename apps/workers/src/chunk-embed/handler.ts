// Chunk + Embed Worker (ECS)

import { SQSEvent } from "aws-lambda";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

import {
  setJobProgress,
  setJobStage,
  setJobStatus,
  expireJob,
  publishJobUpdate,
} from "@repo/cache";
import { ChunkEmbedMessage } from "@repo/queue";
import { DocumentChunk, DocumentModel, IngestionJob } from "@repo/db";
import { logger } from "@repo/observability";
import { PLAN_POLICY, getUserPlan } from "@repo/policy";

// ---------- Clients (created per job to respect plan policy) ----------

function createVectorStore(embeddingModel: string) {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY!,
    model: embeddingModel,
  });

  const pineconeClient = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX!);

  return new PineconeStore(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
}

// ---------- Worker Handler ----------

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    let payload: ChunkEmbedMessage;

    try {
      payload = JSON.parse(record.body);
    } catch (error) {
      logger.error("Invalid SQS message body", { error });
      continue;
    }

    const { jobId, documentId, userId, textLocation } = payload;

    try {
      await setJobStatus(jobId, "processing");
      await setJobStage(jobId, "chunking");
      await setJobProgress(jobId, 85);

      await publishJobUpdate(jobId, {
        stage: "chunking",
        progress: 85,
      });

      // 1. Resolve user's plan & embedding policy
      const plan = await getUserPlan(userId);
      const policy = PLAN_POLICY[plan];
      const embeddingModel = policy.embeddings.model;

      // 2. Resolve text
      if (textLocation.type !== "inline") {
        throw new Error("Only inline text is supported at this stage");
      }

      const text = textLocation.value;

      // 3. Split text using LangChain splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
      });

      const documents = await splitter.createDocuments(
        [text],
        [{ documentId, userId }],
      );

      await setJobProgress(jobId, 90);

      await publishJobUpdate(jobId, {
        stage: "chunking",
        progress: 90,
      });

      // 4. Create vector store using plan-specific embedding model
      const vectorStore = createVectorStore(embeddingModel);

      const vectorIds = documents.map((_, i) => `${documentId}-${i}`);

      await vectorStore.addDocuments(documents, {
        ids: vectorIds,
      });

      await setJobProgress(jobId, 95);

      await publishJobUpdate(jobId, {
        stage: "embedding",
        progress: 95,
      });

      // 5. Persist chunk metadata in Mongo (batch insert)
      await DocumentChunk.insertMany(
        documents.map((doc, i) => ({
          documentId,
          vectorId: vectorIds[i],
          chunkIndex: i,
          metadata: {
            length: doc.pageContent.length,
          },
        })),
      );

      // 6. Mark job + document as completed (authoritative)
      await IngestionJob.findByIdAndUpdate(jobId, {
        status: "completed",
      });

      await DocumentModel.findByIdAndUpdate(documentId, {
        status: "processed",
      });

      // 7. Final Redis updates
      await setJobStage(jobId, "completed");
      await setJobProgress(jobId, 100);
      await expireJob(jobId);

      await publishJobUpdate(jobId, {
        stage: "completed",
        progress: 100,
      });

      logger.info("Chunk + embed completed", {
        jobId,
        documentId,
        chunks: documents.length,
        embeddingModel,
        plan,
      });
    } catch (error) {
      logger.error("Chunk + embed failed", { error, jobId, documentId });

      await IngestionJob.findByIdAndUpdate(jobId, {
        status: "failed",
        error: String(error),
      });

      await DocumentModel.findByIdAndUpdate(documentId, {
        status: "failed",
      });

      // Redis: best-effort failure state
      await setJobStatus(jobId, "failed");
      await setJobStage(jobId, "chunk_embed_failed");
      await publishJobUpdate(jobId, {
        stage: "failed",
        error: String(error),
      });
    }
  }
};
