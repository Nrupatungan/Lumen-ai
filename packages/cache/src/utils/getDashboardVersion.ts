import { getCommandRedisClient } from "../redis_command.js";
import { usageRedisKeys } from "../redis_user.js";

export async function getDashboardVersion(
  redis: ReturnType<typeof getCommandRedisClient>,
  userId: string,
): Promise<number> {
  const v = await redis.get(usageRedisKeys.dashboardVersion(userId));
  return v ? Number(v) : 1;
}
