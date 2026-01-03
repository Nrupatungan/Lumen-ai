import { IncomingMessage } from "http";
import jwt, { JWTPayload } from "jsonwebtoken";

function extractToken(req: IncomingMessage): string | null {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers["authorization"];

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1]!;
  }

  // 2. Cookie: access_token=<token>
  const cookie = req.headers["cookie"];
  if (typeof cookie === "string") {
    const match = cookie.match(/access_token=([^;]+)/);
    if (match) return match[1]!;
  }

  return null;
}

export function authenticateWebSocket(req: IncomingMessage): JWTPayload | null {
  const token = extractToken(req);

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}
