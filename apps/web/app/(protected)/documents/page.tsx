import DocumentsStack from "@/components/documents/DocumentsStack";
import { Container } from "@mui/material";
import React from "react";

export default function DocumentsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <DocumentsStack />
    </Container>
  );
}
