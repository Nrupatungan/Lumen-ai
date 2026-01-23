import { getCommandRedisClient } from "./redis_command.js";
import { Plan } from "@repo/policy/plans";
import { resolveTTL } from "./utils/resolveTtl.js";

function paymentsKey(userId: string) {
  return `user:payments:${userId}`;
}

/* ---------------- Payments ---------------- */

export async function getCachedPayments<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(paymentsKey(userId));
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedPayments(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("payments", plan);

  await redis.set(paymentsKey(userId), JSON.stringify(data), "EX", ttl);
}

export async function invalidatePayments(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(paymentsKey(userId));
}
