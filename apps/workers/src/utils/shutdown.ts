import { logger } from "@repo/observability";

let shuttingDown = false;
let inFlight = 0;

export function isShuttingDown() {
  return shuttingDown;
}

export function markJobStart() {
  inFlight++;
}

export function markJobEnd() {
  inFlight--;
}

export function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;

    shuttingDown = true;
    logger.info(`[shutdown] received ${signal}, draining workers`);

    const start = Date.now();
    const MAX_WAIT_MS = Number(process.env.MAX_WAIT_MS); // keep below ECS hard kill

    while (inFlight > 0 && Date.now() - start < MAX_WAIT_MS) {
      await new Promise((r) => setTimeout(r, 500));
    }

    logger.info("[shutdown] completed, exiting process", {
      inFlight,
    });

    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
