"use client";

import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import {
  AutoAwesome,
  ArrowForward,
  PlayArrow,
  Memory,
  VerifiedUser,
  Storage,
} from "@mui/icons-material";
import React from "react";
import Link from "next/link";

function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        py: { xs: 12, md: 17 },
        overflow: "hidden",
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
      }}
    >
      <Container
        maxWidth="md"
        sx={{ textAlign: "center", position: "relative" }}
      >
        <Chip
          icon={<AutoAwesome sx={{ fontSize: "1rem !important" }} />}
          label="Powered by GPT-4.1 & Advanced RAG"
          variant="outlined"
          sx={{ mb: 4, py: 1, px: 1, borderRadius: "8px", fontWeight: 500 }}
        />

        <Typography
          variant="h2"
          component="h1"
          fontWeight={800}
          gutterBottom
          sx={{
            fontSize: { xs: "2.5rem", md: "4rem" },
            letterSpacing: "-0.02em",
          }}
        >
          Your Documents,{" "}
          <Box
            component="span"
            sx={{
              color: "primary.main",
              background: (theme) =>
                `linear-gradient(to right, ${theme.palette.primary.main}, #3b82f6)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Intelligent
          </Box>
        </Typography>

        <Typography
          variant="h5"
          color="text.secondary"
          sx={{
            mb: 5,
            maxWidth: "700px",
            mx: "auto",
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          Transform your document chaos into an intelligent knowledge base.
          Upload, search, and chat with your documents using cutting-edge AI.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
        >
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/auth/register"
            endIcon={<ArrowForward sx={{ width: 20, height: 18 }} />}
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "initial",
            }}
          >
            Start Free Trial
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<PlayArrow />}
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "initial",
            }}
          >
            Watch Demo
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={4}
          justifyContent="center"
          sx={{ mt: 8, opacity: 0.6, flexWrap: "wrap", gap: 3 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Memory fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              OpenAI
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Storage fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              Vector DB
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VerifiedUser fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              SOC 2 Compliant
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export default HeroSection;
