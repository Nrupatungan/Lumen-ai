/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Razorpay } from "razorpay";
import { JWT } from "next-auth/jwt";
import { User, Session, Account } from "next-auth";

declare global {
  interface Window {
    Razorpay: Razorpay;
  }
}

declare module "next-auth" {
  interface User {
    id: string;
    role: "admin" | "user";
  }

  interface Session {
    user: {
      id: string;
      role: "admin" | "user";
    };
  }

  interface Account {
    backendUser: {
      id: string;
      role: "admin" | "user";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "user";
  }
}