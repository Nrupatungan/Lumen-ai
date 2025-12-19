import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIngestionJob extends Document {
    documentId: mongoose.Types.ObjectId;
    status: "queued" | "processing" | "completed" | "failed";
    retryCount: number;
    error?: string;
}


const IngestionJobSchema = new Schema<IIngestionJob>(
    {
        documentId: { type: Schema.Types.ObjectId, ref: "Document", index: true },
        status: {
        type: String,
        enum: ["queued", "processing", "completed", "failed"],
        default: "queued",
        index: true,
        },
        retryCount: { type: Number, default: 0 },
        error: String,
    },
    { timestamps: true }
);


export const IngestionJob: Model<IIngestionJob> = mongoose.model<IIngestionJob>("IngestionJob", IngestionJobSchema);