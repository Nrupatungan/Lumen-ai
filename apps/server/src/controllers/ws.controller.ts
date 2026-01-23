// GET /api/ws-token
import jwt from "jsonwebtoken";
import { RequestHandler, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "@repo/observability";

export const issueWsToken: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.error("Unauthorized User");
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const payload = {
      sub: req.user.id,
      role: req.user.role,
      typ: "ws",
    };

    const token = jwt.sign(payload, process.env.AUTH_SECRET!, {
      expiresIn: "60s",
      audience: "websocket",
      issuer: "lumen-api",
    });

    res.status(200).json({ token });
  },
);
