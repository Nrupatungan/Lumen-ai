import e, { Express } from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import httpLogger from "./middlewares/morgan.middleware.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import { WebSocketServer } from "ws";

const app: Express = e();
const server = http.createServer(app);
const wss: WebSocketServer = new WebSocketServer({ server });

const allowedOrigins = process.env.CORS_WHITELIST;

app.use(helmet());
app.use(e.urlencoded({ extended: true }));
app.use(e.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins?.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  }),
);

app.use(httpLogger);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Route Imports

// Route mapping

app.use(errorHandler);

export { server, wss };
