"use client";

import { Box } from "@mui/material";
import Chat from "@/components/chat/Chat";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { useMe } from "@/hooks/useMe";
import { useDocuments } from "@/hooks/useDocuments";
import { useState } from "react";

export default function ChatPage() {
  const { data: user, isLoading: userLoading } = useMe();
  const { documents, isLoading: docsLoading } = useDocuments();

  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();

  if (userLoading || docsLoading) {
    return <div>Loading…</div>;
  }

  return (
    <Box display="flex" height="100vh">
      <ChatSidebar
        plan={user?.plan ?? "Free"}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={() => setActiveConversationId(undefined)}
      />

      <Box flex={1}>
        <Chat
          user={{ plan: user?.plan ?? "Free" }}
          documents={documents.map((d) => ({ id: d.id }))}
          activeConversationId={activeConversationId}
        />
      </Box>
    </Box>
  );
}
