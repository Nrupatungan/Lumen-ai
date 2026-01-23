import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { logger } from "@repo/observability";

export type UserPayload = {
  id: string;
  role: "admin" | "user";
};

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let token: string | undefined;

  // 1️⃣ Prefer Authorization header (mobile / server / tests)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2️⃣ Fallback to Auth.js cookie (browser)
  if (!token) {
    token =
      req.cookies?.["authjs.session-token"] ||
      req.cookies?.["__Secure-authjs.session-token"];
  }

  if (!token) {
    logger.warn("No auth token found");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    logger.error("Invalid token", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
