// import { config } from "dotenv";
// config();

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}
