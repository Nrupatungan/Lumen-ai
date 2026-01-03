"use client";

import { testimonials } from "@/lib/data";
import {
  alpha,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

export const TestimonialsSection = () => {
  return (
    <Container sx={{ py: { xs: 10, md: 15 } }}>
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Chip
          label="Testimonials"
          variant="outlined"
          size="small"
          sx={{
            mb: 2,
            fontWeight: 700,
            textTransform: "capitalize",
            borderRadius: 1.1,
          }}
        />
        <Typography
          variant="h3"
          fontWeight="bold"
          sx={{ fontSize: { xs: "1.875rem", md: "2.25rem" } }}
        >
          Loved by teams worldwide
        </Typography>
      </Box>

      <Grid
        container
        spacing={3}
        columns={{ xs: 4, md: 12 }}
        justifyContent="center"
      >
        {testimonials.map((t) => (
          <Grid
            key={t.author}
            size={{ xs: 4, md: 4 }} // ✅ Grid v2 correct
          >
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 4,
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    fontStyle: "italic",
                    mb: 4,
                    lineHeight: 1.6,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                    }}
                  >
                    {t.avatar}
                  </Avatar>

                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.role}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
