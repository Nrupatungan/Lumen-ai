import { z } from "zod";

export const paymentVerificaitonSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(["Free", "Go", "Pro"]),
});

export const orderSchema = z.object({
  plan: z.enum(["Free", "Go", "Pro"]),
});

export type PaymentVerificaitonType = z.infer<typeof paymentVerificaitonSchema>;
export type OrderType = z.infer<typeof orderSchema>;
