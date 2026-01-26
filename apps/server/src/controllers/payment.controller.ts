import { Request, Response, RequestHandler } from "express";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment, Subscription } from "@repo/db";
import { getRazorpay } from "../libs/razorpay.js";
import { logger, logCacheHit, logCacheMiss } from "@repo/observability";
import { Plan, PLAN_POLICY } from "@repo/policy-node";
import {
  getCachedPayments,
  getCachedSubscription,
  invalidatePayments,
  setCachedPayments,
  setCachedSubscription,
} from "@repo/cache";
import z from "zod";
import { orderSchema, paymentVerificaitonSchema } from "@repo/shared-node";
import { getUserPlan } from "@repo/db";

const razorpay = getRazorpay();

/**
 * POST /payments/order
 * Create a Razorpay order and persist Payment record (status=created)
 */
export const createOrder: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const parsed = orderSchema.safeParse(req.body);

    if (parsed.error) {
      return res
        .status(400)
        .json({ error: "Invalid plan", details: z.treeifyError(parsed.error) });
    }

    const { plan } = parsed.data;

    const price = PLAN_POLICY[plan].pricing.price;

    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: "USD",
      receipt: `receipt_${Math.random().toString(36).substring(5)}`,
    });

    // Persist payment intent
    await Payment.create({
      userId,
      orderId: order.id,
      amount: price,
      currency: order.currency,
      status: "created",
    });

    await invalidatePayments(userId);

    logger.info(`Order created for user ${userId}`);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  },
);

/**
 * POST /payments/verify
 * Verify Razorpay signature, finalize payment, and upsert Subscription
 */
export const verifyPayment: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const parsed = paymentVerificaitonSchema.safeParse(req.body);

    if (parsed.error) {
      return res.status(400).json({
        error: "Missing payment fields",
        details: z.treeifyError(parsed.error),
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      parsed.data;

    if (!(plan in PLAN_POLICY)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Verify Razorpay signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      logger.warn("Razorpay signature mismatch", { userId });

      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "failed" },
      );

      await invalidatePayments(userId);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Mark payment successful
    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        status: "success",
        paymentId: razorpay_payment_id,
      },
    );

    // Activate / upsert subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + PLAN_POLICY[plan].pricing.duration);

    await Subscription.findOneAndUpdate(
      { userId },
      {
        plan,
        status: "active",
        startDate,
        endDate,
      },
      { upsert: true },
    );

    await invalidatePayments(userId);

    return res.status(200).json({ message: "Verified payment successfully!" });
  },
);

/**
 * GET /payments/
 * Return current user's payments
 */
export const getMyPayments: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.warn("Unauthorized subscription access");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const cached = await getCachedPayments(userId);

    if (cached) {
      logCacheHit("payments", userId);
      return res.status(200).json({
        payments: cached,
        source: "cache",
      });
    }

    logCacheMiss("payments", userId);

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    setCachedPayments(userId, payments, plan);

    logger.info(`Fetched subscription for user: ${userId}`);
    return res.status(200).json({
      payments,
      source: "mongo",
    });
  },
);

/**
 * GET /payments/subscription
 * Return current user's subscription state
 */
export const getMySubscription: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.warn("Unauthorized subscription access");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    // ---------- CACHE CHECK ----------
    const cached = await getCachedSubscription(userId);
    if (cached) {
      logCacheHit("subscription", userId);
      return res.status(200).json({
        subscription: cached,
        source: "cache",
      });
    }

    logCacheMiss("subscription", userId);

    // ---------- DB QUERY ----------
    const subscription = await Subscription.findOne({ userId }).lean();

    const response = subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        }
      : {
          plan: "Free",
          status: "active",
        };

    // ---------- CACHE SET ----------
    const plan = response.plan ?? "Free";
    await setCachedSubscription(userId, response, plan as Plan);

    logger.info(`Fetched subscription for user: ${userId}`);
    return res.status(200).json({
      subscription: response,
      source: "mongo",
    });
  },
);
