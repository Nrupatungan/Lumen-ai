"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useChunkPreview } from "@/hooks/useChunkPreview";

interface Props {
  open: boolean;
  chunkId?: string;
  onClose: () => void;
}

export default function SourcePreviewModal({ open, chunkId, onClose }: Props) {
  const { data, isLoading } = useChunkPreview(chunkId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Source preview
        {data?.chunkIndex !== undefined && ` · chunk ${data.chunkIndex}`}
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
            }}
          >
            {data?.content}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
