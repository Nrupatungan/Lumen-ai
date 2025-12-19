import mongoose, { Schema, Document as MDocument, Model } from "mongoose";

export interface IDocument extends MDocument {
    userId: mongoose.Types.ObjectId;
    name: string;
    sourceType: "pdf" | "docx" | "md" | "txt" | "image" | "url";
    s3Key: string;
    status: "uploaded" | "processing" | "processed" | "failed";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}


const DocumentSchema = new Schema<IDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        name: { type: String, required: true },
        sourceType: { type: String, required: true },
        s3Key: { type: String, required: true },
        status: {
        type: String,
        enum: ["uploaded", "processing", "processed", "failed"],
        default: "uploaded",
        index: true,
        },
        metadata: Schema.Types.Mixed,
    },
    { timestamps: true }
);


export const DocumentModel: Model<IDocument> = mongoose.model<IDocument>("Document", DocumentSchema);