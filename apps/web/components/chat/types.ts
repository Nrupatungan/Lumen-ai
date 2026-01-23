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
