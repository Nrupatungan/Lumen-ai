import "dotenv/config";
import { handler } from "./handler.js";
import { logger } from "@repo/observability";

async function runOnce() {
  try {
    logger.info("[usage-sync] local run started");
    await handler();
    logger.info("[usage-sync] local run finished");
  } catch (err) {
    logger.error("[usage-sync] local run failed", { err });
    process.exitCode = 1;
  }
}

/**
 * Run once and exit
 * (matches Lambda + EventBridge behavior)
 */
runOnce();
