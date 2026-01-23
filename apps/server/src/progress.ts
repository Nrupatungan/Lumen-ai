// WebSocket server for live ingestion progress using shared Redis Pub/Sub helpers
// Secured with JWT authentication

import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { subscribe, pubSubChannels } from "@repo/cache";
import { IngestionJob } from "@repo/db";
import { logger } from "@repo/observability";
import jwt from "jsonwebtoken";
import { UserPayload } from "./middlewares/jwt-verify.middleware.js";

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
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 30_000);

    const url = new URL(req.url!, "http://localhost");

    const tokenFromQuery = url.searchParams.get("token");

    if (!tokenFromQuery) {
      logger.warn("WS missing token");
      socket.close(1008, "Unauthorized");
      return;
    }

    let user: UserPayload;

    try {
      if (!process.env.AUTH_SECRET) {
        throw new Error("Missing AUTH_SECRET");
      }

      const decoded = jwt.verify(tokenFromQuery, process.env.AUTH_SECRET!, {
        audience: "websocket",
        issuer: "lumen-api",
      }) as jwt.JwtPayload;

      user = {
        id: decoded.sub as string,
        role: decoded.role,
      };
    } catch {
      logger.warn("WS invalid or expired token");
      socket.close(1008, "Invalid token");
      return;
    }

    const context: ClientContext = {
      userId: user.id,
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
          const prevUnsub = context.unsubscribe;
          context.unsubscribe = undefined;

          if (prevUnsub) {
            await prevUnsub();
          }

          context.jobId = msg.jobId;

          // Verify job ownership before subscribing
          const job = await IngestionJob.findOne({
            _id: msg.jobId,
            userId: context.userId,
          }).lean();

          if (!job) {
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
        clearInterval(heartbeat);
      } catch {
        // intentionally ignored
      }
    });

    socket.on("error", (err) => {
      logger.warn("WS socket error", { err });
    });
  });

  logger.info("WebSocket progress server initialized (secured)");
}
