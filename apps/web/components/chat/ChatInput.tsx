"use client";

import { Box, Stack, TextField, IconButton, Typography } from "@mui/material";
import { Send, Stop } from "@mui/icons-material";

interface ChatInputProps {
  value: string;
  placeholder: string;
  disabled: boolean;
  isStreaming: boolean;

  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}

export default function ChatInput({
  value,
  placeholder,
  disabled,
  isStreaming,
  onChange,
  onSend,
  onStop,
}: ChatInputProps) {
  return (
    <Box px={3} py={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <IconButton
          color={isStreaming ? "error" : "primary"}
          onClick={isStreaming ? onStop : onSend}
          disabled={!value.trim() && !isStreaming}
        >
          {isStreaming ? <Stop /> : <Send />}
        </IconButton>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        textAlign="center"
        mt={1}
      >
        Responses are generated from your documents. AI may be inaccurate.
      </Typography>
    </Box>
  );
}
