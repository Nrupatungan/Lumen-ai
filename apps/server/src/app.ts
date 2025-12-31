import e, { Express } from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import httpLogger from "./middlewares/morgan.middleware.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import cookieParser from "cookie-parser";

const app: Express = e();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_WHITELIST;

app.use(helmet());
app.use(e.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(e.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins?.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
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
import routes from "./routes/index.js";

// Route mapping
app.use("/api/v1", routes);

app.use(errorHandler);

export default server;
