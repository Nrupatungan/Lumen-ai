import "express";
import "jsonwebtoken";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      name?: string;
      role: "user" | "admin";
      image?: string;
      email?: string;
    };
  }
}

declare module "jsonwebtoken" {
  interface JWTPayload {
    user?: {
      id: string;
      name?: string;
      role: "user" | "admin";
      image?: string;
      email?: string;
    };
  }
}
