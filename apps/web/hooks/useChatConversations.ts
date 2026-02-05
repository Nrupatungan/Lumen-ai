"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type ConversationLastMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: ConversationLastMessage | null;
};

type ChatConversationsResponse = {
  conversations: ChatConversation[];
  source: "cache" | "mongo";
};

export function useChatConversations() {
  return useQuery<ChatConversation[]>({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const res = await apiClient.getConversations<ChatConversationsResponse>();
      return res.conversations;
    },
    staleTime: 60_000,
  });
}
