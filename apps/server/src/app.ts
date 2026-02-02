import e, { Express } from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import httpLogger from "./middlewares/morgan.middleware.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import cookieParser from "cookie-parser";

const app: Express = e();
const server = http.createServer(app);

const allowedOrigins: string[] = process.env.CORS_WHITELIST
  ? JSON.parse(process.env.CORS_WHITELIST)
  : [];

console.log("CORS whitelist:", allowedOrigins);

// CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, health checks, ALB
      if (!origin) {
        return callback(null, true);
      }

      // Normalize origin (remove trailing slash)
      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

// Explicit preflight support
app.options("/*", cors());
app.use(helmet());
app.use(e.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(e.json());

app.use(httpLogger);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
import routes from "./routes/index.js";
app.use("/api/v1", routes);

// Error handler LAST
app.use(errorHandler);

export default server;
