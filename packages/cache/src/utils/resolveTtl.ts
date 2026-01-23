import { CACHE_TTL_BY_PLAN, CacheType, Plan } from "@repo/policy/plans";

export function resolveTTL(cacheType: CacheType, plan: Plan | undefined) {
  return CACHE_TTL_BY_PLAN[cacheType][plan ?? "Free"];
}
