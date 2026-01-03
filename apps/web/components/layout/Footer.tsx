"use client";

import Link from "next/link";
import {
  Box,
  Container,
  Grid,
  Typography,
  Link as MuiLink,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";
import { AppLogoIcon } from "../CustomIcon";
import { X, GitHub, LinkedIn } from "@mui/icons-material";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "API Docs", href: "/docs" },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
          justifyContent="center"
        >
          {/* Logo + Branding */}
          <Grid size={{ xs: 4, sm: 8, md: 3 }}>
            <MuiLink
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                textDecoration: "none",
                color: "text.primary",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1.5,
                }}
              >
                <AppLogoIcon fill="#52b9ec" size={24} />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                LumenAI
              </Typography>
            </MuiLink>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 280, mb: 3, lineHeight: 1.6 }}
            >
              Transform your documents into intelligent knowledge bases with
              AI-powered search and real-time chat.
            </Typography>

            <Stack direction="row" spacing={1}>
              <IconButton
                component="a"
                href="https://github.com"
                target="_blank"
                size="small"
              >
                <GitHub fontSize="small" />
              </IconButton>
              <IconButton
                component="a"
                href="https://twitter.com"
                target="_blank"
                size="small"
              >
                <X fontSize="small" />
              </IconButton>
              <IconButton
                component="a"
                href="https://linkedin.com"
                target="_blank"
                size="small"
              >
                <LinkedIn fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <Grid key={title} size={{ xs: 2, sm: 4, md: 3 }}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ textTransform: "capitalize", mb: 2 }}
              >
                {title}
              </Typography>

              <Stack spacing={1.5}>
                {links.map((link) => (
                  <MuiLink
                    key={link.label}
                    component={Link}
                    href={link.href}
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textDecoration: "none",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ mt: 8, mb: 4, opacity: 0.6 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          © {currentYear} LumenAI. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
