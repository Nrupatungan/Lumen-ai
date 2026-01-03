"use client";

import { ArrowForward, Check } from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

export const CTASection = () => {
  return (
    <Container sx={{ py: 8 }}>
      <Box
        sx={{
          position: "relative",
          borderRadius: 6,
          p: { xs: 6, md: 10 },
          textAlign: "center",
          bgcolor: "primary.main",
          color: "white",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom right, #1976d2, #2563eb)",
            zIndex: 0,
          }}
        />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            sx={{ fontSize: { xs: "1.875rem", md: "2.5rem" } }}
          >
            Ready to transform your knowledge base?
          </Typography>

          <Typography
            variant="h6"
            sx={{ opacity: 0.9, mb: 4, fontWeight: 400 }}
          >
            Start free and upgrade when you&apos;re ready. No credit card
            required.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 6 }}
          >
            <Button
              variant="contained"
              color="secondary"
              size="large"
              sx={(theme) => ({
                px: 4,
                py: 1,
                fontWeight: 400,
                borderRadius: 2,
                textTransform: "inherit",
                backgroundColor: "#fff",
                color: "black",
                ...theme.applyStyles("dark", {
                  backgroundColor: "black",
                  color: "white",
                }),
              })}
            >
              Get Started Free <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              size="large"
              sx={(theme) => ({
                px: 4,
                py: 1,
                fontWeight: 400,
                borderColor: alpha("#fff", 0.3),
                borderRadius: 2,
                textTransform: "inherit",
                ...theme.applyStyles("dark", {
                  color: "white",
                }),
              })}
            >
              View Pricing
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ gap: 2 }}
          >
            {[
              "Free forever plan",
              "No credit card required",
              "Cancel anytime",
            ].map((text) => (
              <Box
                key={text}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  sx={{
                    border: "1.5px solid white",
                    height: 15,
                    width: 15,
                    borderRadius: 50,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    p: 0.5,
                  }}
                >
                  <Check sx={{ fontSize: 8, fontWeight: 500 }} />
                </Box>

                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, opacity: 0.9, fontSize: 13 }}
                >
                  {text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};
