import "express";
import "jsonwebtoken";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: "user" | "admin";
    };
  }
}

declare module "jsonwebtoken" {
  interface JWTPayload {
    user?: {
      id: string;
      role: "user" | "admin";
    };
  }
}
