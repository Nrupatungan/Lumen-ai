import { connectDB, UsageRecord } from "@repo/db";
import {
  getRestRedisClient,
  invalidateUsageRest,
  invalidateUsageDashboardRest,
} from "@repo/cache/rest";
import { logger } from "@repo/observability";
import { loadConfig } from "../utils/cachedConfig.js";

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
  const { MONGO_URI, URL, TOKEN } = await loadConfig();

  await connectDB(MONGO_URI, process.env.MONGO_DB_NAME!);
  const restRedis = getRestRedisClient(URL, TOKEN);

  logger.info("[usage-sync] starting Redis → Mongo sync");

  let cursor = "0";

  try {
    do {
      const [nextCursor, keys] = (await restRedis.scan(cursor, {
        match: USAGE_KEY_PATTERN,
        count: 100,
      })) as [string, string[]];

      cursor = nextCursor;

      for (const key of keys) {
        const parsed = parseUsageKey(key);
        if (!parsed) continue;

        const { userId, date } = parsed;

        const data = await restRedis.hgetall(key);

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
        await restRedis.del(key);
        await invalidateUsageRest(userId, URL, TOKEN);
        await invalidateUsageDashboardRest(userId, URL, TOKEN);
      }
    } while (cursor !== "0");

    logger.info("[usage-sync] completed successfully");
  } catch (error) {
    logger.error("[usage-sync] failed", { error });
  }
}
