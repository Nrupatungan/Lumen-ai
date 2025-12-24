export type Plan = "Free" | "Go" | "Pro";

export type DocumentSourceType =
  | "pdf"
  | "markdown"
  | "text"
  | "docx"
  | "pptx"
  | "epub"
  | "image"
  | "url";

export const PLAN_POLICY = {
  Free: {
    pricing: {
      price: "0",
    },
    documents: {
      allowedSourceTypes: ["pdf", "markdown", "text"] as DocumentSourceType[],
      maxDocuments: 5,
    },
    chat: {
      dailyTokens: 25_000,
      dailyRequests: 50,
      streaming: false,
      model: "gpt-4.1-mini",
    },
    embeddings: {
      model: "text-embedding-3-small",
    },
    ingestion: {
      ocr: false,
    },
  },

  Go: {
    pricing: {
      price: "5",
    },
    documents: {
      allowedSourceTypes: [
        "pdf",
        "markdown",
        "text",
        "docx",
        "epub",
        "pptx",
      ] as DocumentSourceType[],
      maxDocuments: 50,
    },
    chat: {
      dailyTokens: 250_000,
      dailyRequests: 500,
      streaming: true,
      model: "gpt-4.1-mini",
    },
    embeddings: {
      model: "text-embedding-3-large",
    },
    ingestion: {
      ocr: false,
    },
  },

  Pro: {
    pricing: {
      price: "15",
    },
    documents: {
      allowedSourceTypes: [
        "pdf",
        "md",
        "txt",
        "docx",
        "epub",
        "pptx",
        "image",
      ] as DocumentSourceType[],
      maxDocuments: Infinity,
    },
    chat: {
      dailyTokens: 1_000_000,
      dailyRequests: Infinity,
      streaming: true,
      model: "gpt-4.1",
    },
    embeddings: {
      model: "text-embedding-3-large",
    },
    ingestion: {
      ocr: true,
    },
  },
} as const;
