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

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessageStatus = "optimistic" | "confirmed" | "failed";

export interface RagSource {
  documentId: string;
  documentName?: string;
  chunkId?: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status?: ChatMessageStatus;
  sources?: RagSource[];
}

export type TodayUsage = {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
};

export type UsageDashboardSeries = {
  date: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
};

export type UsageDashboardResponse = {
  range: {
    startDate: string;
    endDate: string;
  };
  days: number;
  series: UsageDashboardSeries[];
};
