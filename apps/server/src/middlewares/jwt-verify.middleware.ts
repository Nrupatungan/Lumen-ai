import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

type UserPayload = {
  id: string;
  name: string;
  role: "admin" | "user";
  email: string;
};

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token) {
    logger.error("No token provided");
    return res.status(401).json({ message: "No token provided" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!);

  req.user = decoded as UserPayload;

  next();
}
