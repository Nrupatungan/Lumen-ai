import { Redis } from "ioredis";

const REDIS_URL = String(process.env.REDIS_URL);
let redis: Redis | null = null;

export function getCommandRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    redis.on("connect", () => {
      console.log("[Redis] connected (tcp)");
    });

    redis.on("error", (err: Error) => {
      console.error("[Redis] error", err);
    });
  }

  return redis;
}

/* -------------------------------------------------
 * Key helpers
 * ------------------------------------------------- */

export const ingestionRedisKeys = {
  jobStatus: (jobId: string) => `job:${jobId}:status`,
  jobStage: (jobId: string) => `job:${jobId}:stage`,
  jobProgress: (jobId: string) => `job:${jobId}:progress`,
  jobError: (jobId: string) => `job:${jobId}:error`,
  documentStatus: (docId: string) => `document:${docId}:status`,
  documentStage: (docId: string) => `document:stage:${docId}`,
};

export async function deleteJobKeys(jobId: string) {
  const client = getCommandRedisClient();
  const keys = [
    ingestionRedisKeys.jobStatus(jobId),
    ingestionRedisKeys.jobStage(jobId),
    ingestionRedisKeys.jobProgress(jobId),
    ingestionRedisKeys.jobError(jobId),
  ];
  await client.del(...keys);
}

/* -------------------------------------------------
 * Write helpers (best-effort)
 * ------------------------------------------------- */

export async function setJobStatus(jobId: string, status: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(ingestionRedisKeys.jobStatus(jobId), status);
  } catch (_) {}
}

export async function setJobStage(jobId: string, stage: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(ingestionRedisKeys.jobStage(jobId), stage);
  } catch (_) {}
}

export async function setJobProgress(jobId: string, progress: number) {
  const client = getCommandRedisClient();
  try {
    await client.set(
      ingestionRedisKeys.jobProgress(jobId),
      progress.toString(),
    );
  } catch (_) {}
}

export async function setJobError(jobId: string, error: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(ingestionRedisKeys.jobError(jobId), error);
  } catch (_) {}
}

export async function setDocumentStatus(docId: string, status: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(ingestionRedisKeys.documentStatus(docId), status);
  } catch (_) {}
}

export async function setDocumentStage(docId: string, stage: string) {
  const client = getCommandRedisClient();
  try {
    await client.set(ingestionRedisKeys.documentStage(docId), stage);
  } catch (_) {}
}

/* -------------------------------------------------
 * Expiry helpers
 * ------------------------------------------------- */

export async function expireJob(jobId: string, ttlSeconds = 60 * 60 * 48) {
  const client = getCommandRedisClient();
  try {
    const keys = [
      ingestionRedisKeys.jobStatus(jobId),
      ingestionRedisKeys.jobStage(jobId),
      ingestionRedisKeys.jobProgress(jobId),
      ingestionRedisKeys.jobError(jobId),
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
      client.get(ingestionRedisKeys.jobStatus(jobId)),
      client.get(ingestionRedisKeys.jobStage(jobId)),
      client.get(ingestionRedisKeys.jobProgress(jobId)),
      client.get(ingestionRedisKeys.jobError(jobId)),
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
