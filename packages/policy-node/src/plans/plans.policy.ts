export type Plan = "Free" | "Go" | "Pro";

export type DocumentSourceType =
  | "pdf"
  | "md"
  | "txt"
  | "docx"
  | "pptx"
  | "epub"
  | "image"
  | "url";

export const PLAN_POLICY = {
  Free: {
    pricing: {
      price: 0,
      duration: Infinity,
    },
    documents: {
      allowedSourceTypes: ["pdf", "md", "txt"] as DocumentSourceType[],
      maxDocuments: 5,
    },
    chat: {
      dailyTokens: 25_000,
      dailyRequests: 10,
      streaming: false,
      model: "gpt-4.1-mini",
      queries: 100,
    },
    embeddings: {
      model: "text-embedding-3-small",
      index: "free-tier",
      expectedDimensions: 1536,
    },
    ingestion: {
      ocr: false,
    },
  },

  Go: {
    pricing: {
      price: 29,
      duration: 30,
    },
    documents: {
      allowedSourceTypes: [
        "pdf",
        "md",
        "txt",
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
      queries: 1000,
    },
    embeddings: {
      model: "text-embedding-3-large",
      index: "paid-tier",
      expectedDimensions: 3072,
    },
    ingestion: {
      ocr: false,
    },
  },

  Pro: {
    pricing: {
      price: 99,
      duration: 30,
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
      queries: Infinity,
    },
    embeddings: {
      model: "text-embedding-3-large",
      index: "paid-tier",
      expectedDimensions: 3072,
    },
    ingestion: {
      ocr: true,
    },
  },
} as const;
