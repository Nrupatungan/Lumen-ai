import { Redis } from "@upstash/redis";

export const usageRedisKeys = {
  profileKey: (userId: string) => `user:profile:${userId}`,
  subscriptionKey: (userId: string) => `user:subscription:${userId}`,
  usageKey: (userId: string) => `user:usage:${userId}`,
  docsKey: (userId: string) => `user:documents:${userId}`,
  docStatusKey: (docId: string) => `document:${docId}:status`,
  dashboardKey: (userId: string, days: number, version: number) =>
    `user:usage-dashboard:${userId}:v${version}:${days}`,
  dashboardVersion: (userId: string) =>
    `user:usage-dashboard-version:${userId}`,
};

export const ingestionRedisKeys = {
  jobStatus: (jobId: string) => `job:${jobId}:status`,
  jobStage: (jobId: string) => `job:${jobId}:stage`,
  jobProgress: (jobId: string) => `job:${jobId}:progress`,
  jobError: (jobId: string) => `job:${jobId}:error`,
  documentStatus: (docId: string) => `document:${docId}:status`,
  documentStage: (docId: string) => `document:stage:${docId}`,
};

let redis: Redis | null = null;

export function getRestRedisClient(url: string, token: string): Redis {
  if (!redis) {
    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}

export async function invalidateDocumentStatusRest(
  documentId: string,
  url: string,
  token: string,
) {
  const restRedis = getRestRedisClient(url, token);
  await restRedis.del(usageRedisKeys.docStatusKey(documentId));
}

export async function setJobStageRest(
  jobId: string,
  stage: string,
  url: string,
  token: string,
) {
  const restRedis = getRestRedisClient(url, token);
  await restRedis.set(ingestionRedisKeys.jobStage(jobId), stage, { ex: 600 });
}

export async function setJobStatusRest(
  jobId: string,
  status: string,
  url: string,
  token: string,
) {
  const restRedis = getRestRedisClient(url, token);
  await restRedis.set(ingestionRedisKeys.jobStatus(jobId), status, { ex: 600 });
}

export async function invalidateUsageRest(
  userId: string,
  url: string,
  token: string,
) {
  const restRedis = getRestRedisClient(url, token);
  await restRedis.del(usageRedisKeys.usageKey(userId));
}

export async function invalidateUsageDashboardRest(
  userId: string,
  url: string,
  token: string,
) {
  const restRedis = getRestRedisClient(url, token);
  await restRedis.incr(usageRedisKeys.dashboardVersion(userId));
}
