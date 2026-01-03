// Authoritative daily usage rollup for LLM usage

import mongoose, { Schema, Types, Model } from "mongoose";

export interface IUsageRecordDocument {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const UsageRecordSchema = new Schema<IUsageRecordDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    totalTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    promptTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    completionTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    requestCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure one record per user per day
UsageRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UsageRecord: Model<IUsageRecordDocument> =
  mongoose.models.UsageRecord ||
  mongoose.model<IUsageRecordDocument>("UsageRecord", UsageRecordSchema);
