import { Request, Response, RequestHandler } from "express";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment, Subscription } from "@repo/db";
import { getRazorpay } from "../libs/razorpay.js";
import { logger, logCacheHit, logCacheMiss } from "@repo/observability";
import { Plan, PLAN_POLICY } from "@repo/policy";
import { getCachedSubscription, setCachedSubscription } from "@repo/cache";

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

    const { plan } = req.body as { plan: keyof typeof PLAN_POLICY };

    if (!plan || !(plan in PLAN_POLICY)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const amount = PLAN_POLICY[plan].pricing.price;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${req.user.id}_${Date.now()}`,
    });

    // Persist payment intent
    await Payment.create({
      userId: req.user.id,
      orderId: order.id,
      amount,
      currency: order.currency,
      status: "created",
    });

    return res.json({
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      req.body as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        plan: keyof typeof PLAN_POLICY;
      };

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !plan
    ) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

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
      logger.warn("Razorpay signature mismatch", { userId: req.user.id });

      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "failed" },
      );

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

    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      {
        plan,
        status: "active",
        startDate,
        endDate,
      },
      { upsert: true, new: true },
    );

    return res.json({
      status: "success",
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  },
);

/**
 * GET /payments/subscription
 * Return current user's subscription state
 */
export const getMySubscription: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      logger.warn("Unauthorized subscription access");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    // ---------- CACHE CHECK ----------
    const cached = await getCachedSubscription(userId);
    if (cached) {
      logCacheHit("subscription", userId);
      return res.json(cached);
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
    return res.json(response);
  }
);
