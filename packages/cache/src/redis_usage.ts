// Redis helpers for fast, best-effort LLM usage tracking

import { getUserPlan } from "@repo/db";
import { getCommandRedisClient } from "./redis_command.js";

export interface UsageIncrement {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

function todayKey(userId: string) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `usage:${userId}:${date}`;
}

/**
 * Increment usage counters for a user (best-effort)
 */
export async function incrementUsage(userId: string, usage: UsageIncrement) {
  const client = getCommandRedisClient();
  const key = todayKey(userId);
  const plan = getUserPlan(userId);

  try {
    const pipeline = client.pipeline();

    if (usage.promptTokens) {
      pipeline.hincrby(key, "promptTokens", usage.promptTokens);
    }

    if (usage.completionTokens) {
      pipeline.hincrby(key, "completionTokens", usage.completionTokens);
    }

    if (usage.totalTokens) {
      pipeline.hincrby(key, "totalTokens", usage.totalTokens);
    }

    pipeline.hincrby(key, "requestCount", 1);
    pipeline.expire(key, Number(process.env.USAGE_TTL_SECONDS));

    await pipeline.exec();
  } catch (_) {
    // best-effort: never throw
  }
}

/**
 * Get today's usage counters for a user
 */
export async function getDailyUsage(userId: string) {
  const client = getCommandRedisClient();
  const key = todayKey(userId);

  try {
    const data = await client.hgetall(key);

    return {
      promptTokens: Number(data.promptTokens || 0),
      completionTokens: Number(data.completionTokens || 0),
      totalTokens: Number(data.totalTokens || 0),
      requestCount: Number(data.requestCount || 0),
    };
  } catch (_) {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
    };
  }
}
