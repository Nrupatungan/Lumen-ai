import { getCommandRedisClient } from "./redis_command.js";
import { CacheType, Plan, CACHE_TTL_BY_PLAN } from "@repo/policy";

function profileKey(userId: string) {
  return `user:profile:${userId}`;
}

function subscriptionKey(userId: string) {
  return `user:subscription:${userId}`;
}

function usageKey(userId: string) {
  return `user:usage:${userId}`;
}

function docsKey(userId: string) {
  return `user:documents:${userId}`;
}

function docStatusKey(docId: string) {
  return `document:status:${docId}`;
}

function dashboardKey(userId: string, days: number) {
  return `user:usage-dashboard:${userId}:${days}`;
}

function resolveTTL(cacheType: CacheType, plan: Plan | undefined) {
  return CACHE_TTL_BY_PLAN[cacheType][plan ?? "Free"];
}

/* ----------------------------- Profile ----------------------------- */

export async function getCachedUserProfile<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(profileKey(userId));
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCachedUserProfile(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("profile", plan);

  await redis.set(profileKey(userId), JSON.stringify(data), "EX", ttl);
}

export async function invalidateUserProfile(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(profileKey(userId));
}

/* -------------------------- Subscription --------------------------- */

export async function getCachedSubscription<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(subscriptionKey(userId));
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCachedSubscription(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("subscription", plan);

  await redis.set(subscriptionKey(userId), JSON.stringify(data), "EX", ttl);
}

export async function invalidateSubscription(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(subscriptionKey(userId));
}

/* ----------------------------- Usage ------------------------------- */

export async function getCachedUsage<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(usageKey(userId));
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCachedUsage(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("usage", plan);

  await redis.set(usageKey(userId), JSON.stringify(data), "EX", ttl);
}

export async function invalidateUsage(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(usageKey(userId));
}

/* ---------------- Usage Dashboard ---------------- */
export async function getCachedUsageDashboard<T = any>(
  userId: string,
  days: number,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const v = await redis.get(dashboardKey(userId, days));
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

  await redis.set(dashboardKey(userId, days), JSON.stringify(data), "EX", ttl);
}

export async function invalidateUsageDashboard(userId: string) {
  const redis = getCommandRedisClient();
  const pattern = `user:usage-dashboard:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(keys);
}

/* ---------------- Documents List ---------------- */

export async function getCachedDocuments<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const v = await redis.get(docsKey(userId));
  return v ? JSON.parse(v) : null;
}

export async function setCachedDocuments(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("documents", plan);

  await redis.set(docsKey(userId), JSON.stringify(data), "EX", ttl);
}

export async function invalidateDocuments(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(docsKey(userId));
}

/* ---------------- Document Status ---------------- */

export async function getCachedDocumentStatus<T = any>(
  documentId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const v = await redis.get(docStatusKey(documentId));
  return v ? JSON.parse(v) : null;
}

export async function setCachedDocumentStatus(
  documentId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("document_status", plan);

  await redis.set(docStatusKey(documentId), JSON.stringify(data), "EX", ttl);
}

export async function invalidateDocumentStatus(documentId: string) {
  const redis = getCommandRedisClient();
  await redis.del(docStatusKey(documentId));
}

/* ----------------------------- Cleanup ------------------------------ */

export async function invalidateAllUserCaches(userId: string) {
  const redis = getCommandRedisClient();

  await redis.del(
    profileKey(userId),
    subscriptionKey(userId),
    usageKey(userId),
    docsKey(userId),
  );

  const dashboardKeys = await redis.keys(`user:usage-dashboard:${userId}:*`);
  if (dashboardKeys.length) {
    await redis.del(dashboardKeys);
  }
}
