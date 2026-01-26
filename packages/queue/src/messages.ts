import { DocumentSourceType } from "@repo/policy-node";

export interface BaseMessage {
  jobId: string;
  documentId: string;
  userId: string;
}

export interface DocumentIngestMessage extends BaseMessage {
  sourceType: DocumentSourceType;
  s3Key: string;
}

export interface TextExtractMessage extends BaseMessage {
  s3Key: string;
  sourceType: Omit<DocumentSourceType, "image" | "url">;
}

export interface OCRMessage extends BaseMessage {
  s3Key: string;
}

export interface ChunkEmbedMessage extends BaseMessage {
  textLocation: {
    type: "s3" | "inline";
    value: string;
  };
}
