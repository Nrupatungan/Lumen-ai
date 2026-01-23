import { DocumentChunk } from "./document-chunk.model.js";
import mongoose, { Schema, Document as MDocument, Model } from "mongoose";

export interface IDocument extends MDocument {
  userId: mongoose.Types.ObjectId;
  name: string;
  sourceType: "pdf" | "docx" | "md" | "txt" | "epub" | "pptx" | "image" | "url";
  s3Key: string;
  status: "uploaded" | "processing" | "processed" | "failed" | "deleting";
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
      enum: ["uploaded", "processing", "processed", "failed", "deleting"],
      default: "uploaded",
      index: true,
    },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

DocumentSchema.pre("findOneAndDelete", async function () {
  const filter = this.getFilter();

  const document = await mongoose
    .model("Document")
    .findOne(filter)
    .select("_id");

  if (!document) return;

  await DocumentChunk.deleteMany({ documentId: document._id });
});

export const DocumentModel: Model<IDocument> =
  mongoose.models.DocumentModel ||
  mongoose.model<IDocument>("Document", DocumentSchema);
