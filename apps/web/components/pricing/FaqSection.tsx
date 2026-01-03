import { faqs } from "@/lib/data";
import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Container,
  Typography,
} from "@mui/material";
import React from "react";

export default function FaqSection() {
  return (
    <Container sx={{ pb: 14, textAlign: "center" }} maxWidth="md">
      <Chip
        label="FAQ"
        variant="outlined"
        size="small"
        sx={{
          mb: 2,
          fontWeight: 700,
          letterSpacing: "0.05em",
          borderRadius: 1.1,
        }}
      />
      <Typography variant="h4" textAlign="center" fontWeight={700} mb={6}>
        Frequently asked questions
      </Typography>

      {faqs.map((f, i) => (
        <Accordion key={i} sx={{ py: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>{f.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary" textAlign="justify">
              {f.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  );
}
