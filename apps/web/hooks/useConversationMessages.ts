import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { ChatMessage } from "@/components/chat/types";

type ConversationMessagesResponse = {
  messages: ChatMessage[];
};

export function useConversationMessages(conversationId?: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const res =
        await apiClient.getConversationMessages<ConversationMessagesResponse>(
          conversationId!,
        );

      return res.messages;
    },
  });
}
