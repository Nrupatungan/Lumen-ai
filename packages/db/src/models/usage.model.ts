import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUsage extends Document {
    userId: mongoose.Types.ObjectId;
    tokensUsed: number;
    embeddingsUsed: number;
    documentsProcessed: number;
    period: string; // YYYY-MM
}


const UsageSchema = new Schema<IUsage>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        tokensUsed: { type: Number, default: 0 },
        embeddingsUsed: { type: Number, default: 0 },
        documentsProcessed: { type: Number, default: 0 },
        period: { type: String, index: true },
    },
    { timestamps: true }
);


UsageSchema.index({ userId: 1, period: 1 }, { unique: true });


export const Usage: Model<IUsage> = mongoose.model<IUsage>("Usage", UsageSchema);