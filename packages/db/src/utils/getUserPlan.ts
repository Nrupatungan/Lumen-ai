import { Subscription } from "@repo/db";
import { Plan } from "@repo/policy-node";

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await Subscription.findOne({ userId }).lean();

  if (!subscription) return "Free";
  if (subscription.status !== "active") return "Free";

  return subscription.plan as Plan;
}
