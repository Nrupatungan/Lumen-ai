// Usage Dashboard API: exposes daily usage data for the authenticated user

import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UsageRecord } from "@repo/db";
import { logger, logCacheHit, logCacheMiss } from "@repo/observability";
import {
  getCachedUsage,
  getCachedUsageDashboard,
  getCachedUserProfile,
  getDailyUsage,
  setCachedUsage,
  setCachedUsageDashboard,
} from "@repo/cache";
import { Plan } from "@repo/policy/plans";
import { getUserPlan } from "@repo/policy/utils";
/**
 * GET /usage/dashboard
 *
 * Query params:
 *   - days (optional, default = 7)
 *
 * Returns daily usage rollups for the authenticated user
 */
export const getUsageDashboard: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.warn("Unauthorized usage dashboard access");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const days = Math.min(
      Number(req.query.days) || 7,
      Number(process.env.DASHBOARD_ACCESS_CAP),
    );

    const cached = await getCachedUsageDashboard(userId, days);
    const plan = await getUserPlan(userId);

    if (cached) {
      logCacheHit("usage_dashboard", userId);
      return res.json({
        data: cached,
        source: "cache",
      });
    }
    logCacheMiss("usage_dashboard", userId);

    // Calculate date range
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);

    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    // Fetch usage records (authoritative)
    const records = await UsageRecord.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .lean();

    // Normalize into a continuous date series
    const byDate = new Map(records.map((r) => [r.date, r]));

    const series = [] as Array<{
      date: string;
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      requestCount: number;
    }>;

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = d.toISOString().slice(0, 10);

      const record = byDate.get(date);

      series.push({
        date,
        totalTokens: record?.totalTokens ?? 0,
        promptTokens: record?.promptTokens ?? 0,
        completionTokens: record?.completionTokens ?? 0,
        requestCount: record?.requestCount ?? 0,
      });
    }

    const response = {
      range: { startDate, endDate },
      days,
      series,
    };

    logger.info(`Fetched usage dashboard for user ${userId} for ${days} days`);
    await setCachedUsageDashboard(userId, days, response, plan);
    return res.status(200).json({ data: response, source: "mongo" });
  },
);

/**
 * GET /usage/
 * Lightweight usage summary for today
 */
export const getMyUsage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      logger.warn("Unauthorized user!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    // ---------- CACHE CHECK ----------
    const cached = await getCachedUsage(userId);
    if (cached) {
      logCacheHit("usage", userId);
      return res.status(200).json({ usage: cached, source: "cache" });
    }

    logCacheMiss("usage", userId);

    // ---------- REDIS SOURCE ----------
    const usage = await getDailyUsage(userId);

    // ---------- CACHE SET ----------
    const profile = await getCachedUserProfile(userId);
    const plan: Plan = profile?.plan ?? "Free";
    await setCachedUsage(userId, usage, plan);

    logger.info(`Fetched usage summary for user ${userId}`);
    return res.status(200).json({ usage, source: "mongo" });
  },
);
