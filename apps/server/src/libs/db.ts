import mongoose from "mongoose";
import logger from "../config/logger";

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    logger.info("MONGODB: already connected");
    return;
  }

  mongoose.set("strictQuery", false);

  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      dbName: process.env.MONGO_DB_NAME,
    });

    isConnected = true;
    logger.info("✅ MongoDB connected successfully");
  } catch (error) {
    logger.error("❌ MongoDB connection failed:", error);
  }
}
