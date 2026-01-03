// Redis → Mongo usage sync worker
// Periodically aggregates Redis daily usage counters into Mongo UsageRecord

import { UsageRecord } from "@repo/db";
import {
  getCommandRedisClient,
  invalidateUsage,
  invalidateUsageDashboard,
} from "@repo/cache";
import { logger } from "@repo/observability";

// Redis key pattern: usage:{userId}:{YYYY-MM-DD}
const USAGE_KEY_PATTERN = "usage:*";

interface ParsedUsageKey {
  userId: string;
  date: string;
}

function parseUsageKey(key: string): ParsedUsageKey | null {
  // key format: usage:{userId}:{date}
  const parts = key.split(":");
  if (parts.length !== 3) return null;

  const [, userId, date] = parts;
  if (!userId || !date) return null;

  return { userId, date };
}

export async function handler() {
  const redis = getCommandRedisClient();

  logger.info("[usage-sync] starting Redis → Mongo sync");

  let cursor = "0";

  try {
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        USAGE_KEY_PATTERN,
        "COUNT",
        100,
      );

      cursor = nextCursor;

      for (const key of keys) {
        const parsed = parseUsageKey(key);
        if (!parsed) continue;

        const { userId, date } = parsed;

        const data = await redis.hgetall(key);

        if (!data || Object.keys(data).length === 0) continue;

        const promptTokens = Number(data.promptTokens || 0);
        const completionTokens = Number(data.completionTokens || 0);
        const totalTokens = Number(data.totalTokens || 0);
        const requestCount = Number(data.requestCount || 0);

        // Upsert into Mongo (authoritative)
        await UsageRecord.updateOne(
          { userId, date },
          {
            $inc: {
              promptTokens,
              completionTokens,
              totalTokens,
              requestCount,
            },
          },
          { upsert: true },
        );

        // Optional: delete Redis key after successful sync
        await redis.del(key);
        await invalidateUsage(userId);
        await invalidateUsageDashboard(userId);
      }
    } while (cursor !== "0");

    logger.info("[usage-sync] completed successfully");
  } catch (error) {
    logger.error("[usage-sync] failed", { error });
  }
}
