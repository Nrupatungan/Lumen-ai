"use client";

import { Stack, Divider } from "@mui/material";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/apiClient";
import { streamChat } from "@/lib/chatStream";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import ChatMessageList from "./ChatMessageList";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import { withInlineCitations } from "@/utils";
import { ChatMessage } from "@/lib/types";

interface ChatPageProps {
  user: {
    plan: "Free" | "Go" | "Pro";
  };
  documents: { id: string }[];
  activeConversationId?: string;
}

export default function Chat({
  user,
  documents,
  activeConversationId,
}: ChatPageProps) {
  const canStream = user.plan !== "Free";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined,
  );

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const { data: loadedMessages, isLoading: isLoadingMessages } =
    useConversationMessages(activeConversationId);

  const documentIds = useMemo(() => documents.map((d) => d.id), [documents]);

  /* --------------------------------
     Load messages on conversation switch
  ---------------------------------*/
  useEffect(() => {
    if (!activeConversationId || !loadedMessages) return;

    abortRef.current?.abort();
    abortRef.current = null;

    setIsStreaming(false);
    setIsLoading(false);

    setMessages(loadedMessages);
    setConversationId(activeConversationId);
  }, [activeConversationId, loadedMessages]);

  /* --------------------------------
     Reset when starting new chat
  ---------------------------------*/
  useEffect(() => {
    if (activeConversationId !== undefined) return;

    abortRef.current?.abort();
    abortRef.current = null;

    setMessages([]);
    setConversationId(undefined);
    setIsStreaming(false);
    setIsLoading(false);
  }, [activeConversationId]);

  /* --------------------------------
     Helpers
  ---------------------------------*/
  const appendMessage = (msg: ChatMessage) =>
    setMessages((prev) => [...prev, msg]);

  const updateMessage = (
    id: string,
    updater: (m: ChatMessage) => ChatMessage,
  ) => setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));

  /* --------------------------------
     Non-streaming (Free plan)
  ---------------------------------*/
  const sendRequestChat = async (text: string, optimisticId: string) => {
    setIsLoading(true);

    try {
      const res = await apiClient.sendChatMessage({
        message: text,
        documentIds,
        conversationId,
      });

      setConversationId(res.conversationId);

      // confirm optimistic user message
      updateMessage(optimisticId, (m) => ({
        ...m,
        status: "confirmed",
      }));

      // append assistant message
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: withInlineCitations(res.message, res.sources),
        createdAt: new Date().toISOString(),
        sources: res.sources,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      updateMessage(optimisticId, (m) => ({
        ...m,
        status: "failed",
      }));

      toast({
        severity: "error",
        title: "Chat failed",
        description: err?.response?.data?.error ?? "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* --------------------------------
     Streaming (Go / Pro)
  ---------------------------------*/
  const sendStreamingChat = async (text: string, optimisticId: string) => {
    const assistantId = crypto.randomUUID();

    // confirm optimistic user message
    updateMessage(optimisticId, (m) => ({
      ...m,
      status: "confirmed",
    }));

    appendMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    });

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      await streamChat({
        message: text,
        documentIds,
        conversationId,
        signal: controller.signal,

        onToken: (token) => {
          updateMessage(assistantId, (m) => ({
            ...m,
            content: m.content + token,
          }));
        },

        onComplete: () => {
          updateMessage(assistantId, (m) => ({
            ...m,
            content: withInlineCitations(m.content, m.sources),
          }));

          setIsStreaming(false);
          abortRef.current = null;
        },

        onError: (error) => {
          updateMessage(optimisticId, (m) => ({
            ...m,
            status: "failed",
          }));

          setIsStreaming(false);
          abortRef.current = null;

          toast({
            severity: "error",
            title: "Streaming failed",
            description: error ?? "Unable to stream response",
          });
        },
      });
    } catch {
      updateMessage(optimisticId, (m) => ({
        ...m,
        status: "failed",
      }));

      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  /* --------------------------------
     Unified send handler
  ---------------------------------*/
  const handleSend = async (text = input) => {
    if (!text.trim() || isStreaming || isLoading || isLoadingMessages) return;

    const optimisticId = crypto.randomUUID();

    appendMessage({
      id: optimisticId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      status: "optimistic",
    });

    setInput("");

    if (canStream) {
      await sendStreamingChat(text, optimisticId);
    } else {
      await sendRequestChat(text, optimisticId);
    }
  };

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const handleStopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  if (!user) return null;

  /* --------------------------------
     Render
  ---------------------------------*/
  return (
    <Stack height="100%">
      <ChatHeader
        canStream={canStream}
        hasMessages={messages.length > 0}
        onClear={() => {
          setMessages([]);
          setConversationId(undefined);
        }}
      />

      <ChatMessageList
        messages={messages}
        isLoading={isStreaming || isLoading || isLoadingMessages}
        copiedId={copiedId}
        onCopy={handleCopy}
        onSendSuggested={handleSend}
      />

      <Divider />

      <ChatInput
        value={input}
        placeholder={
          documents.length === 0
            ? "Upload documents to start chatting..."
            : "Ask a question about your documents..."
        }
        disabled={
          documents.length === 0 ||
          isStreaming ||
          isLoading ||
          isLoadingMessages
        }
        isStreaming={isStreaming}
        onChange={setInput}
        onSend={handleSend}
        onStop={handleStopStreaming}
      />
    </Stack>
  );
}
