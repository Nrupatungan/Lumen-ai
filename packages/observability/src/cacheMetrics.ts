import { logger } from "./logger.js";

export type CacheType =
  | "profile"
  | "subscription"
  | "usage"
  | "usage_dashboard"
  | "documents"
  | "document_status";

export function logCacheHit(type: CacheType, userId: string) {
  logger.info("cache.hit", {
    cache: type,
    userId,
  });
}

export function logCacheMiss(type: CacheType, userId: string) {
  logger.info("cache.miss", {
    cache: type,
    userId,
  });
}
