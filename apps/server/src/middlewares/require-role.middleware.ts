import { Request, Response, NextFunction } from "express";
import { logger } from "@repo/observability";

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.error("Unauthorized role");
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== role) {
      logger.error("Forbidden");
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
