import { wss } from "./app";
import logger from "./config/logger";

wss.on("connection", (ws) => {
  // const origin = req.headers.origin;

  // if (
  //     origin &&
  //     !process.env.CORS_WHITELIST?.includes(origin)
  // ) {
  //     ws.close(1008, "Origin not allowed");
  //     return;
  // }

  logger.info("🔌 WebSocket connected");

  // Send welcome message immediately
  ws.send(
    JSON.stringify({
      type: "connected",
      message: "WebSocket connection established",
    }),
  );

  ws.on("error", (error) => {
    logger.error(
      "Something went wrong while Establishing Web Socket connection",
      error,
    );
  });

  ws.on("message", (data) => {
    const msg = data.toString();
    logger.info(`📨 Received: ${msg}`);

    // Echo back
    ws.send(
      JSON.stringify({
        type: "chat_ack",
        message: msg,
      }),
    );
  });

  ws.on("pong", () => {
    logger.info("🏓 Pong received");
  });

  ws.on("close", () => {
    logger.warn("Closing WebSocket connection");
  });
});

// heartbeat
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.ping();
    }
  });
}, 15000);
