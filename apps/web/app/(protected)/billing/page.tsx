import BillingStack from "@/components/billing/BillingStack";
import { Container } from "@mui/material";
import React from "react";

export default function page() {
  return (
    <Container
      maxWidth="md"
      sx={{
        py: 10,
      }}
    >
      <BillingStack />
    </Container>
  );
}
