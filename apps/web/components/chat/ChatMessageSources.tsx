"use client";

import { RagSource } from "@/lib/types";
import { Stack, Button, Typography } from "@mui/material";

interface Props {
  sources: RagSource[];
  onPreview: (chunkId: string) => void;
}

export default function ChatMessageSources({ sources, onPreview }: Props) {
  if (!sources.length) return null;

  return (
    <Stack spacing={0.5} mt={1}>
      <Typography variant="caption" color="text.secondary">
        Sources
      </Typography>

      {sources.map((s, i) => (
        <Button
          key={i}
          size="small"
          variant="outlined"
          sx={{ justifyContent: "flex-start", textTransform: "none" }}
          onClick={() => s.chunkId && onPreview(s.chunkId)}
        >
          [{i + 1}] {s.documentName ?? "Document"} · chunk {s.chunkId}
        </Button>
      ))}
    </Stack>
  );
}
