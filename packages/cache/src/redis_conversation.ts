import { getCommandRedisClient } from "./redis_command.js";
import { Plan } from "@repo/policy/plans";
import { resolveTTL } from "./utils/resolveTtl.js";

function conversationsKey(userId: string) {
  return `user:conversations:${userId}`;
}

/* ---------------- Conversations ---------------- */

export async function getCachedConversations<T = any>(
  userId: string,
): Promise<T | null> {
  const redis = getCommandRedisClient();
  const cached = await redis.get(conversationsKey(userId));
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedConversations(
  userId: string,
  data: unknown,
  plan?: Plan,
) {
  const redis = getCommandRedisClient();
  const ttl = resolveTTL("conversations", plan);

  await redis.set(conversationsKey(userId), JSON.stringify(data), "EX", ttl);
}

export async function invalidateConversations(userId: string) {
  const redis = getCommandRedisClient();
  await redis.del(conversationsKey(userId));
}
