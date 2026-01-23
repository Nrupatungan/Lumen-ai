"use client";

import { Box, Stack, Typography, Button, Chip } from "@mui/material";
import { Refresh, AutoAwesome } from "@mui/icons-material";

interface ChatHeaderProps {
  canStream: boolean;
  hasMessages: boolean;
  onClear: () => void;
}

export default function ChatHeader({
  canStream,
  hasMessages,
  onClear,
}: ChatHeaderProps) {
  return (
    <Box px={3} py={2} borderBottom={1} borderColor="divider">
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <Typography variant="h6">AI Chat</Typography>
          <Typography variant="body2" color="text.secondary">
            Ask questions about your documents
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Chip
            icon={<AutoAwesome />}
            label={canStream ? "Streaming (Faster)" : "Standard"}
            variant="outlined"
          />

          {hasMessages && (
            <Button size="small" startIcon={<Refresh />} onClick={onClear}>
              Clear
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
