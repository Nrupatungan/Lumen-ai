import { Redis } from "ioredis";

let redis: Redis | null = null;

export function getCommandRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    redis.on("connect", () => {
      console.log("[Redis] connected");
    });

    redis.on("error", (err) => {
      console.error("[Redis] error", err);
    });
  }

  return redis;
}

/* -------------------------------------------------
 * Key helpers
 * ------------------------------------------------- */

export const redisKeys = {
  jobStatus: (jobId: string) => `job:${jobId}:status`,
  jobStage: (jobId: string) => `job:${jobId}:stage`,
  jobProgress: (jobId: string) => `job:${jobId}:progress`,
  jobError: (jobId: string) => `job:${jobId}:error`,

  documentStatus: (docId: string) => `document:${docId}:status`,
  documentStage: (docId: string) => `document:${docId}:stage`,
};

/* -------------------------------------------------
 * Write helpers (best-effort)
 * ------------------------------------------------- */

export async function setJobStatus(jobId: string, status: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(redisKeys.jobStatus(jobId), status);
  } catch (_) {}
}

export async function setJobStage(jobId: string, stage: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(redisKeys.jobStage(jobId), stage);
  } catch (_) {}
}

export async function setJobProgress(jobId: string, progress: number) {
  const client = getCommandRedisClient();
  try {
    await client.set(redisKeys.jobProgress(jobId), progress.toString());
  } catch (_) {}
}

export async function setJobError(jobId: string, error: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(redisKeys.jobError(jobId), error);
  } catch (_) {}
}

export async function setDocumentStatus(docId: string, status: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(redisKeys.documentStatus(docId), status);
  } catch (_) {}
}

export async function setDocumentStage(docId: string, stage: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(redisKeys.documentStage(docId), stage);
  } catch (_) {}
}

/* -------------------------------------------------
 * Expiry helpers
 * ------------------------------------------------- */

export async function expireJob(jobId: string, ttlSeconds = 60 * 60 * 48) {
  const client = getCommandRedisClient();
  try {
    const keys = [
      redisKeys.jobStatus(jobId),
      redisKeys.jobStage(jobId),
      redisKeys.jobProgress(jobId),
      redisKeys.jobError(jobId),
    ];
    await Promise.all(keys.map((k) => client.expire(k, ttlSeconds)));
  } catch (_) {}
}

/* -------------------------------------------------
 * Read helpers (for API)
 * ------------------------------------------------- */

export async function getJobProgress(jobId: string) {
  const client = getCommandRedisClient();
  try {
    const [status, stage, progress, error] = await Promise.all([
      client.get(redisKeys.jobStatus(jobId)),
      client.get(redisKeys.jobStage(jobId)),
      client.get(redisKeys.jobProgress(jobId)),
      client.get(redisKeys.jobError(jobId)),
    ]);

    if (!status && !stage && !progress) return null;

    return {
      status,
      stage,
      progress: progress ? Number(progress) : undefined,
      error,
      source: "redis",
    };
  } catch (_) {
    return null;
  }
}
