import { auth } from "@/auth";
import { pricingTiers } from "@/lib/data";
import { Check } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import React from "react";
import PaymentButton from "./PaymentButton";

export default async function Tiers() {
  const session = await auth();

  return (
    <Container>
      <Grid container spacing={4}>
        {pricingTiers.map((tier) => (
          <Grid key={tier.id} size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                border: tier.popular ? 2 : 1,
                borderColor: tier.popular ? "primary.main" : "divider",
                px: 2,
                py: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <CardHeader title={tier.name} />
                {tier.popular && (
                  <Chip
                    label="Popular"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
              <CardContent>
                <Typography variant="h4" fontWeight={700}>
                  ${tier.price}
                  {tier.price > 0 && (
                    <Typography component="span" color="text.secondary">
                      /month
                    </Typography>
                  )}
                </Typography>

                <Box sx={{ mt: 3 }}>
                  {tier.features.map((f) => (
                    <Box key={f} sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <Check color="primary" fontSize="small" />
                      <Typography variant="body2">{f}</Typography>
                    </Box>
                  ))}
                </Box>

                <PaymentButton
                  tier={{ name: tier.name, popular: tier.popular, session }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
