import { Chip, Container, Typography } from "@mui/material";
import React from "react";

export default function PricingHero() {
  return (
    <Container sx={{ py: { xs: 8, md: 11 }, textAlign: "center" }}>
      <Chip
        label="Pricing"
        variant="outlined"
        size="small"
        sx={{
          mb: 2,
          fontWeight: 700,
          letterSpacing: "0.05em",
          borderRadius: 1.1,
        }}
      />
      <Typography variant="h3" fontWeight={700}>
        Simple, transparent pricing
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        Start free and scale as you grow. No hidden fees.
      </Typography>
    </Container>
  );
}
