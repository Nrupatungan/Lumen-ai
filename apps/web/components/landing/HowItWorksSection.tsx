import {
  alpha,
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import React from "react";

export const HowItWorksSection = () => {
  return (
    <Box
      sx={{
        py: { xs: 10, md: 15 },
        bgcolor: alpha("#000", 0.02),
        borderY: 1,
        borderColor: "divider",
      }}
    >
      <Container>
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Chip
            label="How It Works"
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
            From upload to insight in minutes
          </Typography>
        </Box>
        <Grid container spacing={6} justifyContent="center">
          {[
            {
              step: 1,
              title: "Upload Documents",
              desc: "Drag and drop your PDFs, Word docs, or text files. We handle the rest.",
            },
            {
              step: 2,
              title: "AI Processing",
              desc: "Documents are chunked, embedded, and indexed using advanced AI models.",
            },
            {
              step: 3,
              title: "Chat & Search",
              desc: "Ask questions in natural language and get accurate, sourced answers.",
            },
          ].map((item) => (
            <Grid key={item.step} sx={{ textAlign: "center", xs: 12, md: 4 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  mx: "auto",
                  mb: 3,
                  fontSize: "1.5rem",
                  fontWeight: 800,
                }}
              >
                {item.step}
              </Avatar>

              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {item.title}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: "280px", mx: "auto" }}
              >
                {item.desc}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
