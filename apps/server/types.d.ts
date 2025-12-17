import "express";

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
