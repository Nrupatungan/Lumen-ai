import { Plan } from "./plans.policy.js";

export type CacheType =
  | "profile"
  | "subscription"
  | "usage"
  | "usage_dashboard"
  | "documents"
  | "document_status";

/**
 * TTLs are in seconds
 * Higher plans → longer TTLs → better performance
 */
export const CACHE_TTL_BY_PLAN: Record<
  CacheType,
  Record<Plan, number>
> = {
  profile: {
    Free: 120,
    Go: 300,
    Pro: 600,
  },
  subscription: {
    Free: 300,
    Go: 600,
    Pro: 1800,
  },
  usage: {
    Free: 30,  // very volatile
    Go: 45,
    Pro: 60,
  },

  // 👇 NEW
  usage_dashboard: {
    Free: 60,     // dashboard is read-heavy
    Go: 120,
    Pro: 300,
  },
  documents: {
    Free: 30,
    Go: 60,
    Pro: 120,
  },
  document_status: {
    Free: 10,     // very volatile
    Go: 15,
    Pro: 30,
  },
};
