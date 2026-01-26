import { NextFunction, Request, RequestHandler, Response } from "express";
import Busboy from "busboy";
import { asyncHandler } from "../utils/asyncHandler.js";
import { DocumentChunk, DocumentModel, IngestionJob } from "@repo/db";
import {
  setJobProgress,
  setJobStage,
  setJobStatus,
  getJobProgress,
  invalidateDocuments,
  getCachedDocuments,
  setCachedDocuments,
  getCachedDocumentStatus,
  setCachedDocumentStatus,
  invalidateDocumentStatus,
} from "@repo/cache";
import { DocumentIngestMessage } from "@repo/queue";
import { sendMessage, uploadStreamToS3 } from "@repo/aws";
import { PassThrough } from "node:stream";
import { logCacheHit, logCacheMiss, logger } from "@repo/observability";
import { getUserPlan } from "@repo/db";
import { DocumentSourceType, PLAN_POLICY } from "@repo/policy-node";
import { resolveSourceType } from "../utils/sourceTypeResolver.js";
import crypto from "node:crypto";

/**
 * POST /documents/upload
 * Uploads users document.
 */
export const uploadDocument: RequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      logger.error("Unauthorized User");
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const userId = req.user?.id;
    const busboy = Busboy({ headers: req.headers });

    let documentId: string | null = null;
    let jobId: string | null = null;
    let uploadPromise: Promise<void> | null = null;
    let sourceType: DocumentSourceType;
    let s3Key: string;

    busboy.on("file", (_fieldname, file, info) => {
      const { filename, mimeType } = info;

      uploadPromise = (async () => {
        const plan = await getUserPlan(userId.toString());
        const policy = PLAN_POLICY[plan];

        sourceType = resolveSourceType(filename)!;
        if (!sourceType) throw new Error("Unsupported file type");

        if (!policy.documents.allowedSourceTypes.includes(sourceType)) {
          throw new Error("Plan does not allow this file type");
        }

        s3Key = `documents/${crypto.randomUUID()}-${filename}`;
        const name = `${crypto.randomBytes(7).toString("hex")}-${filename.split(".")[0]}`;

        const document = await DocumentModel.create({
          userId,
          name,
          sourceType,
          s3Key,
          status: "uploaded",
        });

        const job = await IngestionJob.create({
          userId,
          documentId: document._id,
          status: "queued",
        });

        documentId = document._id.toString();
        jobId = job._id.toString();

        await setJobStatus(jobId, "queued");
        await setJobStage(jobId, "uploading");
        await setJobProgress(jobId, 0);

        const pass = new PassThrough();
        file.pipe(pass);

        await uploadStreamToS3(
          process.env.S3_BUCKET_NAME!,
          s3Key,
          pass,
          mimeType,
        );
      })().catch(next);
    });

    busboy.on("finish", async () => {
      if (!uploadPromise || !documentId || !jobId || !sourceType) {
        logger.error("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }

      try {
        await uploadPromise;

        // 5. Send SQS message after upload completes
        const message: DocumentIngestMessage = {
          jobId,
          documentId,
          userId: userId.toString(),
          sourceType,
          s3Key,
        };

        await invalidateDocuments(userId);

        await sendMessage(process.env.DOCUMENT_INGEST_QUEUE_URL!, message);

        logger.info("Sending ingestion message", message);

        return res.status(202).json({
          documentId,
          jobId,
          status: "queued",
        });
      } catch (error) {
        next(error);
      }
    });

    req.pipe(busboy);
  },
);

/**
 * GET /documents/:id/status
 */
export const getDocumentStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.error("Unauthorized user tried to fetch document status");
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const { documentId } = req.params;
    const userId = req.user.id;

    const cached = await getCachedDocumentStatus(documentId!);
    const plan = await getUserPlan(userId);

    if (cached) {
      logCacheHit("document_status", userId);
      return res.status(200).json({
        documentStatus: cached,
        source: "cache",
      });
    }
    logCacheMiss("document_status", userId);

    // 1. Fetch document (authoritative ownership check)
    const document = await DocumentModel.findOne({
      _id: documentId,
      userId,
    }).lean();

    if (!document) {
      logger.warn("Document not found or access denied", {
        documentId,
        userId,
      });
      return res.status(404).json({ error: "Document not found" });
    }

    // 2. Fetch latest ingestion job for this document
    const job = await IngestionJob.findOne({ documentId })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Try Redis first (fast path)
    if (job) {
      const redisStatus = await getJobProgress(job._id.toString());

      if (redisStatus) {
        const documentStatus = {
          documentId: document._id,
          jobId: job._id,
          documentStatus: document.status,
          jobStatus: redisStatus.status ?? job.status,
          stage: redisStatus.stage,
          progress: redisStatus.progress,
          error: redisStatus.error,
        };

        await setCachedDocumentStatus(documentId!, documentStatus, plan);
        return res.status(200).json({
          documentStatus,
          source: "cache",
        });
      }
    }

    const documentStatus = {
      documentId: document._id,
      jobId: job?._id,
      documentStatus: document.status,
      jobStatus: job?.status,
      source: "mongo",
    };

    // 4. Fallback to MongoDB (authoritative)
    await setCachedDocumentStatus(documentId!, documentStatus, plan);
    return res.status(200).json({
      documentStatus,
      source: "mongo",
    });
  },
);

export const listDocuments: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.error("Unauthorized user tried to list documents");
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const userId = req.user.id;
    const cached = await getCachedDocuments(userId);
    const plan = await getUserPlan(userId);

    if (cached) {
      logCacheHit("documents", userId);
      return res.status(200).json({
        documents: cached,
        source: "cache",
      });
    }
    logCacheMiss("documents", userId);

    // 1. Fetch all documents for user
    const documents = await DocumentModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (documents.length === 0) {
      return res.status(200).json({ documents: [] });
    }

    const documentIds = documents.map((doc) => doc._id);

    // 2. Fetch latest ingestion job per document
    const jobs = await IngestionJob.aggregate([
      { $match: { documentId: { $in: documentIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$documentId",
          jobId: { $first: "$_id" },
          status: { $first: "$status" },
          error: { $first: "$error" },
        },
      },
    ]);

    const jobMap = new Map(jobs.map((job) => [job._id.toString(), job]));

    // 3. Shape response
    const response = documents.map((doc) => {
      const job = jobMap.get(doc._id.toString());

      return {
        id: doc._id,
        name: doc.name,
        sourceType: doc.sourceType,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        ingestion: job
          ? {
              jobId: job.jobId,
              status: job.status,
              error: job.error,
            }
          : null,
      };
    });

    await setCachedDocuments(userId, response, plan);
    return res.status(200).json({ documents: response, source: "mongo" });
  },
);

/**
 * GET /documents/chunks/:chunkId
 */
export const getDocumentChunk: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { chunkId } = req.params;

    const chunk = await DocumentChunk.findById(chunkId).select({
      documentId: 1,
      chunkIndex: 1,
      metadata: 1,
    });

    if (!chunk) {
      return res.status(404).json({ error: "Chunk not found" });
    }

    // 👇 safely resolve chunk text
    const content =
      chunk.metadata?.pageContent ??
      chunk.metadata?.text ??
      chunk.metadata?.content ??
      "";

    if (!content) {
      return res.status(404).json({
        error: "Chunk content not available",
      });
    }

    return res.status(200).json({
      content,
      chunkIndex: chunk.chunkIndex,
      documentId: chunk.documentId,
    });
  },
);

export const deleteDocument: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.error("Unauthorized document delete attempt");
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const userId = req.user.id;
    const { documentId } = req.params;

    // 1. Ownership check
    const document = await DocumentModel.findOne({
      _id: documentId,
      userId,
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Prevent double deletion
    if (document.status === "deleting") {
      return res.status(202).json({ status: "already_deleting" });
    }

    // 2. Mark as deleting (authoritative)
    document.status = "deleting";
    await document.save();

    // 3. Enqueue deletion job
    await sendMessage(process.env.DOCUMENT_DELETE_QUEUE_URL!, {
      documentId: document._id.toString(),
      userId,
      s3Key: document.s3Key,
    });

    await invalidateDocuments(userId);
    await invalidateDocumentStatus(documentId!);

    return res.status(202).json({
      documentId: document._id,
      status: "deleting",
    });
  },
);
