import { NextFunction, Request, RequestHandler, Response } from "express";
import Busboy from "busboy";
import { asyncHandler } from "../utils/asyncHandler.js";
import { DocumentModel, IngestionJob } from "@repo/db";
import {
  setJobProgress,
  setJobStage,
  setJobStatus,
  setDocumentStatus,
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
import { PLAN_POLICY, getUserPlan, DocumentSourceType } from "@repo/policy";

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

    busboy.on("file", async (_fieldname, file, info) => {
      (async () => {
        try {
          const { filename, mimeType } = info;

          const plan = await getUserPlan(userId.toString());
          const policy = PLAN_POLICY[plan];

          if (
            !policy.documents.allowedSourceTypes.includes(
              mimeType as DocumentSourceType,
            )
          ) {
            return res.status(403).json({
              error: `Your ${plan} plan does not allow uploading ${mimeType} documents`,
            });
          }

          const existingCount = await DocumentModel.countDocuments({ userId });
          if (existingCount >= policy.documents.maxDocuments) {
            return res.status(403).json({
              error: `Your ${plan} plan allows only ${policy.documents.maxDocuments} documents`,
            });
          }

          // 1. Create Mongo records early
          const document = await DocumentModel.create({
            userId,
            name: filename,
            sourceType: mimeType.includes("pdf") ? "pdf" : "txt",
            s3Key: "",
            status: "uploaded",
          });

          const job = await IngestionJob.create({
            documentId: document._id,
            status: "queued",
          });

          documentId = document._id.toString();
          jobId = job._id.toString();

          // 2. Initialize Redis (best-effort)
          await setJobStatus(jobId, "queued");
          await setJobStage(jobId, "uploading");
          await setJobProgress(jobId, 0);
          await setDocumentStatus(documentId, "uploaded");

          // 3. Stream to S3
          const s3Key = `documents/${userId}/${documentId}`;
          const pass = new PassThrough();

          // 🔐 stream error handling
          file.on("error", next);
          pass.on("error", next);

          uploadPromise = uploadStreamToS3(
            process.env.S3_BUCKET_NAME!,
            s3Key,
            pass,
            mimeType,
          );
          file.pipe(pass);

          // 4. Update document with S3 key
          document.s3Key = s3Key;
          await document.save();
        } catch (error) {
          next(error);
        }
      })();
    });

    busboy.on("finish", async () => {
      if (!uploadPromise || !documentId || !jobId) {
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
          sourceType: "pdf",
          s3Key: `documents/${userId}/${documentId}`,
        };

        await invalidateDocuments(userId);

        await sendMessage(process.env.DOCUMENT_INGEST_QUEUE_URL!, message);

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

export const getDocumentStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.error("Unauthorized user tried to fetch document status");
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const { documentId } = req.params;
    const userId = req.user.id;

    const cached = await getCachedDocumentStatus(userId);
    const plan = await getUserPlan(userId);

    if (cached) {
      logCacheHit("document_status", userId);
      return res.status(200).json(cached);
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
        const response = {
          documentId: document._id,
          jobId: job._id,
          documentStatus: document.status,
          jobStatus: redisStatus.status ?? job.status,
          stage: redisStatus.stage,
          progress: redisStatus.progress,
          error: redisStatus.error,
          source: "redis",
        };

        await setCachedDocumentStatus(documentId!, response, plan);
        return res.status(200).json(response);
      }
    }

    const response = {
      documentId: document._id,
      jobId: job?._id,
      documentStatus: document.status,
      jobStatus: job?.status,
      source: "mongo",
    };

    // 4. Fallback to MongoDB (authoritative)
    await setCachedDocumentStatus(documentId!, response, plan);
    return res.status(200).json(response);
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
      return res.status(200).json(cached);
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

    await setCachedDocuments(userId, { documents: response }, plan);
    return res.status(200).json({ documents: response });
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
    await sendMessage(process.env.DELETE_QUEUE_URL!, {
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
