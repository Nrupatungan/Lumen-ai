"use client";

import {
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import { Add, ArrowBack, Psychology } from "@mui/icons-material";
import Link from "next/link";

import { useChatConversations } from "@/hooks/useChatConversations";
import { ChatConversation } from "@/hooks/useChatConversations";
import AccountMenu from "./AccountMenu";

interface Props {
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  plan: "Free" | "Go" | "Pro";
}

export default function ChatSidebar({
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: Props) {
  const { data: conversations, isLoading } = useChatConversations();

  return (
    <Box
      width={280}
      borderRight={1}
      borderColor="divider"
      display="flex"
      flexDirection="column"
      height="100vh"
    >
      {/* Header */}
      <Box p={2}>
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <ArrowBack />
          <Box
            sx={{
              display: "flex",
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Psychology />
          </Box>
          <Typography variant="h6" fontWeight="bold">
            LumenAI
          </Typography>
        </Box>

        <Button
          fullWidth
          startIcon={<Add />}
          sx={{ mt: 2, textTransform: "inherit" }}
          onClick={onNewChat}
        >
          New chat
        </Button>
      </Box>

      <Divider />

      {/* Conversation list */}
      <Box flex={1} overflow="auto">
        <Typography variant="caption" px={2} py={1} color="text.secondary">
          Conversations
        </Typography>

        <List dense>
          {isLoading && (
            <Typography px={2} py={1}>
              Loading…
            </Typography>
          )}

          {conversations?.map((c: ChatConversation) => {
            const title =
              c.title ?? c.lastMessage?.content ?? "New conversation";

            return (
              <ListItemButton
                key={c.id}
                selected={c.id === activeConversationId}
                onClick={() => onSelectConversation(c.id)}
              >
                <ListItemText
                  primary={title}
                  secondary={new Date(c.updatedAt).toLocaleDateString()}
                  slotProps={{
                    primary: {
                      noWrap: true,
                      fontSize: 14,
                      fontWeight: 500,
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Footer */}
      <Box p={2}>
        <AccountMenu />
      </Box>
    </Box>
  );
}
