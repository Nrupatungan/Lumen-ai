// WebSocket server for live ingestion progress using shared Redis Pub/Sub helpers
// Secured with JWT authentication

import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { subscribe, pubSubChannels } from "@repo/cache";
import { IngestionJob } from "@repo/db";
import { logger } from "@repo/observability";
import { authenticateWebSocket } from "./utils/webSocketauth.js";

interface ClientContext {
  userId: string;
  jobId?: string;
  unsubscribe?: () => Promise<void> | void;
}

export function initProgressWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/progress",
  });

  wss.on("connection", (socket: WebSocket, req) => {
    const authorizedUser = authenticateWebSocket(req)?.user;

    if (!authorizedUser || !authorizedUser.id) {
      logger.warn("WS unauthorized connection rejected");
      socket.close(1008, "Unauthorized"); // Policy Violation
      return;
    }

    const context: ClientContext = {
      userId: authorizedUser.id,
    };

    socket.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        /**
         * Expected client message:
         * { action: "subscribe", jobId: string }
         */
        if (msg.action === "subscribe" && msg.jobId) {
          // Clean up previous subscription if any
          if (context.unsubscribe) {
            await context.unsubscribe();
            context.unsubscribe = undefined;
          }

          context.jobId = msg.jobId;

          // Verify job ownership before subscribing
          const job = await IngestionJob.findOne({ _id: msg.jobId }).lean();

          if (!job || job.userId.toString() !== context.userId) {
            logger.warn("WS job ownership violation", {
              jobId: msg.jobId,
              userId: context.userId,
            });
            socket.send(JSON.stringify({ error: "Forbidden" }));
            return;
          }

          // Subscribe via shared helper
          context.unsubscribe = await subscribe(
            pubSubChannels.job(msg.jobId),
            (payload) => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(payload));
              }
            },
          );

          logger.info("WS subscribed to job", {
            jobId: msg.jobId,
            userId: context.userId,
          });
        }
      } catch (error) {
        logger.error("Invalid WS message", { error });
      }
    });

    socket.on("close", async () => {
      try {
        if (context.unsubscribe) {
          await context.unsubscribe();
        }
      } catch {
        // intentionally ignored
      }
    });
  });

  logger.info("WebSocket progress server initialized (secured)");
}
