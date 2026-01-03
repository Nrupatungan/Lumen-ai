import type { ErrorRequestHandler } from "express";
import { logger } from "@repo/observability";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
