import mongoose, { ConnectOptions } from "mongoose";

let isConnected = false;

export async function connectDB(uri: string, dbName: ConnectOptions["dbName"]) {
  if (isConnected) {
    console.log("MONGODB: already connected");
    return;
  }

  mongoose.set("strictQuery", false);

  try {
    await mongoose.connect(uri, {
      dbName,
    });

    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}
