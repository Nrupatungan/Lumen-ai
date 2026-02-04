import "./../utils/env.js";
import { handler } from "./handler.js";

async function runOnce() {
  try {
    console.info("[usage-sync] local run started");
    await handler();
    console.info("[usage-sync] local run finished");
  } catch (err) {
    console.error("[usage-sync] local run failed", { err });
    process.exitCode = 1;
  }
}

/**
 * Run once and exit
 * (matches Lambda + EventBridge behavior)
 */
runOnce();
