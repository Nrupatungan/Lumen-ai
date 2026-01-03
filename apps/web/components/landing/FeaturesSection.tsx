"use client";

import { features } from "@/lib/data";
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import React from "react";

export const FeaturesSection = () => {
  return (
    <Container
      component="section"
      id="features"
      sx={{ py: { xs: 10, md: 15 } }}
    >
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Chip
          label="Features"
          variant="outlined"
          size="small"
          sx={{
            mb: 2,
            fontWeight: 700,
            textTransform: "capitalize",
            letterSpacing: "0.05em",
            borderRadius: 1.1,
          }}
        />
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: { xs: "1.875rem", md: "2.25rem" } }}
        >
          Everything you need for intelligent document management
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: "600px", mx: "auto" }}
        >
          From ingestion to insights, LumenAI provides a complete AI-powered
          knowledge platform.
        </Typography>
      </Box>

      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        columns={{ xs: 4, sm: 8, md: 12 }}
        justifyContent="center"
      >
        {features.map((feature) => (
          <Grid
            key={feature.title}
            size={{ xs: 4, sm: 4, md: 4 }} // ✅ 1 / 2 / 3 columns
          >
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 4,
                transition: "0.3s",
                "&:hover": {
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  {<feature.Icon />}
                </Box>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
