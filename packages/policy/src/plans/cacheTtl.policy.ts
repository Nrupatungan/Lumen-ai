import { Plan } from "./plans.policy";

export type CacheType =
  | "profile"
  | "subscription"
  | "usage"
  | "usage_dashboard"
  | "documents"
  | "document_status"
  | "conversations"
  | "payments";

/**
 * TTLs are in seconds
 * Higher plans → longer TTLs → better performance
 */
export const CACHE_TTL_BY_PLAN: Record<CacheType, Record<Plan, number>> = {
  profile: {
    Free: 120,
    Go: 300,
    Pro: 600,
  },
  subscription: {
    Free: 900, // 15 min
    Go: 1800, // 30 min
    Pro: 3600, // 1 hour
  },
  usage: {
    Free: 15,
    Go: 20,
    Pro: 30,
  },
  usage_dashboard: {
    Free: 80, // dashboard is read-heavy
    Go: 120,
    Pro: 300,
  },
  documents: {
    Free: 45,
    Go: 90,
    Pro: 180,
  },
  document_status: {
    Free: 10, // very volatile
    Go: 15,
    Pro: 30,
  },
  conversations: {
    Free: 60,
    Go: 120,
    Pro: 300,
  },
  payments: {
    Free: 300, // 5 min
    Go: 600, // 10 min
    Pro: 1800, // 30 min
  },
};
