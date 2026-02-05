"use client";

// NEW import
import { DocumentItem } from "@/hooks/useDocuments";
import { useJobProgress } from "@/hooks/useJobProgress";
import { Chip, LinearProgress, Stack, Typography } from "@mui/material";

// NEW component (place above DocumentsStack)
export default function DocumentStatus({ doc }: { doc: DocumentItem }) {
  console.log("DocumentStatus rendered", doc.id, doc.status);
  const isProcessing =
    doc.status === "processing" && Boolean(doc.ingestion?.jobId);

  const { progress, stage, error } = useJobProgress({
    jobId: doc.ingestion?.jobId,
    enabled: isProcessing,
  });

  if (!isProcessing) {
    return (
      <Chip
        size="small"
        label={doc.status}
        color={
          doc.status === "ready"
            ? "success"
            : doc.status === "failed"
              ? "error"
              : "default"
        }
      />
    );
  }

  return (
    <Stack spacing={0.5}>
      <Chip size="small" label={stage ?? "Processing"} color="warning" />
      <LinearProgress
        variant={progress != null ? "determinate" : "indeterminate"}
        value={progress}
      />
      {error && <Typography color="error">{error}</Typography>}
    </Stack>
  );
}
