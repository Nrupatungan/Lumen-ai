"use client";

import { Stack, Avatar, Paper, Typography, IconButton } from "@mui/material";
import { Person, ContentCopy, Check } from "@mui/icons-material";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatMessage } from "./types";
import { useMe } from "@/hooks/useMe";
import { useState } from "react";
import SourcePreviewModal from "./SourcePreviewModal";
import ChatMessageSources from "./ChatMessageSources";

interface ChatMessageItemProps {
  message: ChatMessage;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

export default function ChatMessageItem({
  message,
  copiedId,
  onCopy,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";
  const { data: userProfile } = useMe();
  const [previewChunkId, setPreviewChunkId] = useState<string | undefined>();

  return (
    <Stack
      direction="row"
      spacing={1.5}
      justifyContent={isUser ? "flex-end" : "flex-start"}
    >
      {isAssistant && message.sources?.length ? (
        <ChatMessageSources
          sources={message.sources}
          onPreview={(chunkId) => setPreviewChunkId(chunkId)}
        />
      ) : null}

      <Paper
        sx={{
          p: 2,
          maxWidth: "75%",
          bgcolor: isUser
            ? "primary.main"
            : isSystem
              ? "grey.100"
              : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          fontStyle: isSystem ? "italic" : "normal",
          borderRadius: 3.5,
        }}
      >
        {message.role === "user" ? (
          <Typography variant="body2" whiteSpace="pre-wrap">
            {message.content}
          </Typography>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p
                  style={{
                    margin: "0.5em 0",
                    fontSize: "0.95em",
                    lineHeight: "1.75em",
                  }}
                >
                  {children}
                </p>
              ),

              ol: ({ children }) => (
                <ol
                  style={{
                    paddingLeft: "1.25em",
                    margin: "0.5em 0",
                    fontSize: "0.95em",
                    lineHeight: "1.75em",
                  }}
                >
                  {children}
                </ol>
              ),

              ul: ({ children }) => (
                <ul
                  style={{
                    paddingLeft: "1.25em",
                    margin: "0.5em 0",
                    fontSize: "0.95em",
                    lineHeight: "1.75em",
                  }}
                >
                  {children}
                </ul>
              ),

              li: ({ children }) => (
                <li style={{ marginBottom: "0.25em" }}>{children}</li>
              ),

              strong: ({ children }) => (
                <strong
                  style={{
                    fontWeight: 600,
                    fontSize: "0.95em",
                    lineHeight: "1.75em",
                  }}
                >
                  {children}
                </strong>
              ),

              a: ({ href, children }) => (
                <a
                  href={href}
                  style={{
                    color: "#2563eb",
                    textDecoration: "underline",
                    fontSize: "0.95em",
                    lineHeight: "1.75em",
                  }}
                >
                  {children}
                </a>
              ),

              h1: ({ children }) => (
                <h1
                  style={{
                    marginTop: "1em",
                    fontSize: "1.4em",
                    lineHeight: "1.33em",
                  }}
                >
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2
                  style={{
                    marginTop: "1em",
                    fontSize: "1.15em",
                    lineHeight: "1.33em",
                  }}
                >
                  {children}
                </h2>
              ),

              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");

                if (isBlock) {
                  return (
                    <pre
                      style={{
                        background: "#0f172a",
                        color: "#e5e7eb",
                        padding: "12px",
                        borderRadius: 6,
                        overflowX: "auto",
                        fontSize: "0.7rem",
                      }}
                    >
                      <code>{children}</code>
                    </pre>
                  );
                }

                return (
                  <code
                    style={{
                      background: "#e5e7eb",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: "0.6em",
                    }}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {isAssistant && (
          <IconButton
            size="small"
            onClick={() => onCopy(message.content, message.id)}
            sx={{ position: "relative", top: 5, right: 4 }}
          >
            {copiedId === message.id ? (
              <Check fontSize="small" color="success" />
            ) : (
              <ContentCopy fontSize="small" />
            )}
          </IconButton>
        )}
      </Paper>

      {isUser && (
        <Avatar src={userProfile?.image ?? ""}>
          <Person />
        </Avatar>
      )}

      <SourcePreviewModal
        open={Boolean(previewChunkId)}
        chunkId={previewChunkId}
        onClose={() => setPreviewChunkId(undefined)}
      />
    </Stack>
  );
}
