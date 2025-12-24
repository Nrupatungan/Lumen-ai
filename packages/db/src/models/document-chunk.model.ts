import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDocumentChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  vectorId: string;
  chunkIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", index: true },
    vectorId: { type: String, required: true, unique: true },
    chunkIndex: Number,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const DocumentChunk: Model<IDocumentChunk> =
  mongoose.models.DocumentChunk ||
  mongoose.model<IDocumentChunk>("DocumentChunk", DocumentChunkSchema);
