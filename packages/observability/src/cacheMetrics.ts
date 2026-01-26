import { logger } from "./logger.js";
import { CacheType } from "@repo/policy-node";

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
