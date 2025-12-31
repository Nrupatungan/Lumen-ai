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
      price: 0,
      duration: Infinity
    },
    documents: {
      allowedSourceTypes: ["pdf", "markdown", "text"] as DocumentSourceType[],
      maxDocuments: 2,
    },
    chat: {
      dailyTokens: 25_000,
      dailyRequests: 10,
      streaming: false,
      model: "gpt-4.1-mini",
    },
    embeddings: {
      model: "text-embedding-3-small",
      index: process.env.PINECONE_INDEX_SMALL!
    },
    ingestion: {
      ocr: false,
    },
  },

  Go: {
    pricing: {
      price: 15,
      duration: 30
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
      index: process.env.PINECONE_INDEX_LARGE!
    },
    ingestion: {
      ocr: false,
    },
  },

  Pro: {
    pricing: {
      price: 50,
      duration: 30
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
      index: process.env.PINECONE_INDEX_LARGE!
    },
    ingestion: {
      ocr: true,
    },
  },
} as const;
