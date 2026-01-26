import { getCommandRedisClient } from "./redis_command.js";
import { Plan } from "@repo/policy-node";
import { resolveTTL } from "./utils/resolveTtl.js";
import { getDashboardVersion } from "./utils/getDashboardVersion.js";

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

/* ----------------------------- Profile ----------------------------- */

export async function getCachedUserProfile<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(usageRedisKeys.profileKey(userId));
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCachedUserProfile(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("profile", plan);

  await redis.set(
    usageRedisKeys.profileKey(userId),
    JSON.stringify(data),
    "EX",
    ttl,
  );
}

export async function invalidateUserProfile(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(usageRedisKeys.profileKey(userId));
}

/* -------------------------- Subscription --------------------------- */

export async function getCachedSubscription<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(usageRedisKeys.subscriptionKey(userId));
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCachedSubscription(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("subscription", plan);

  await redis.set(
    usageRedisKeys.subscriptionKey(userId),
    JSON.stringify(data),
    "EX",
    ttl,
  );
}

export async function invalidateSubscription(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(usageRedisKeys.subscriptionKey(userId));
}

/* ----------------------------- Usage ------------------------------- */

export async function getCachedUsage<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(usageRedisKeys.usageKey(userId));
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCachedUsage(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("usage", plan);

  await redis.set(
    usageRedisKeys.usageKey(userId),
    JSON.stringify(data),
    "EX",
    ttl,
  );
}

export async function invalidateUsage(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(usageRedisKeys.usageKey(userId));
}

/* ---------------- Usage Dashboard ---------------- */
export async function getCachedUsageDashboard<T = any>(
  userId: string,
  days: number,
): Promise<T | null> {
  const redis = getCommandRedisClient();

  const version = await getDashboardVersion(redis, userId);
  const key = usageRedisKeys.dashboardKey(userId, days, version);

  const v = await redis.get(key);
  return v ? JSON.parse(v) : null;
}

export async function setCachedUsageDashboard(
  userId: string,
  days: number,
  data: unknown,
  plan: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("usage_dashboard", plan);

  const version = await getDashboardVersion(redis, userId);
  const key = usageRedisKeys.dashboardKey(userId, days, version);

  await redis.set(key, JSON.stringify(data), "EX", ttl);
}

export async function invalidateUsageDashboard(userId: string) {
  const redis = getCommandRedisClient();
  await redis.incr(usageRedisKeys.dashboardVersion(userId));
}

/* ---------------- Documents List ---------------- */

export async function getCachedDocuments<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const v = await redis.get(usageRedisKeys.docsKey(userId));
  return v ? JSON.parse(v) : null;
}

export async function setCachedDocuments(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("documents", plan);

  await redis.set(
    usageRedisKeys.docsKey(userId),
    JSON.stringify(data),
    "EX",
    ttl,
  );
}

export async function invalidateDocuments(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(usageRedisKeys.docsKey(userId));
}

/* ---------------- Document Status ---------------- */

export async function getCachedDocumentStatus<T = any>(
  documentId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const v = await redis.get(usageRedisKeys.docStatusKey(documentId));
  return v ? JSON.parse(v) : null;
}

export async function setCachedDocumentStatus(
  documentId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("document_status", plan);

  await redis.set(
    usageRedisKeys.docStatusKey(documentId),
    JSON.stringify(data),
    "EX",
    ttl,
  );
}

export async function invalidateDocumentStatus(documentId: string) {
  const redis = getCommandRedisClient();
  await redis.del(usageRedisKeys.docStatusKey(documentId));
}

/* ----------------------------- Cleanup ------------------------------ */

export async function invalidateAllUserCaches(userId: string) {
  const redis = getCommandRedisClient();

  await redis.del(
    usageRedisKeys.profileKey(userId),
    usageRedisKeys.subscriptionKey(userId),
    usageRedisKeys.usageKey(userId),
    usageRedisKeys.docsKey(userId),
  );

  // invalidate dashboard safely
  await redis.incr(usageRedisKeys.dashboardVersion(userId));
}
