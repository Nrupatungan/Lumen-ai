"use client";

import {
  Box,
  Stack,
  Avatar,
  Typography,
  Paper,
  CircularProgress,
  Button,
} from "@mui/material";
import { SmartToy, AutoAwesome } from "@mui/icons-material";

import { ChatMessage } from "./types";
import ChatMessageItem from "./ChatMessageItem";
import { suggestedPrompts } from "@/lib/data";
import { useEffect, useRef } from "react";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onSendSuggested: (text: string) => void;
}

export default function ChatMessageList({
  messages,
  isLoading,
  copiedId,
  onCopy,
  onSendSuggested,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /* --------------------------------
     Auto-scroll
  ---------------------------------*/
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <Box ref={scrollRef} flex={1} overflow="auto" px={3} py={2}>
        <Stack alignItems="center" spacing={3} mt={6}>
          <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
            <SmartToy />
          </Avatar>

          <Typography variant="h6">Start a conversation</Typography>

          <Stack spacing={1} width="100%" maxWidth={500}>
            {suggestedPrompts.map((p, i) => (
              <Button
                key={i}
                variant="outlined"
                startIcon={<AutoAwesome />}
                disabled={isLoading}
                onClick={() => onSendSuggested(p)}
                sx={{
                  textTransform: "inherit",
                  borderRadius: 3.5,
                }}
              >
                {p}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box flex={1} overflow="auto" px={3} py={2}>
      <Stack spacing={2} maxWidth={900} mx="auto">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            copiedId={copiedId}
            onCopy={onCopy}
          />
        ))}

        {isLoading && (
          <Stack direction="row" spacing={1}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <SmartToy />
            </Avatar>
            <Paper sx={{ p: 2 }}>
              <CircularProgress size={18} />
            </Paper>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
