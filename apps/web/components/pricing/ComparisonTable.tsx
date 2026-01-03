import { pricingTiers } from "@/lib/data";
import { Check, HelpOutline } from "@mui/icons-material";
import {
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

export default function ComparisonTable() {
  return (
    <Container sx={{ py: { xs: 10, md: 14 } }}>
      <Typography variant="h4" textAlign="center" fontWeight={700} mb={4}>
        Compare plans
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              {pricingTiers.map((t) => (
                <TableCell align="center" key={t.id}>
                  {t.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Documents
                <Tooltip
                  title="Number of documents you can upload and process"
                  arrow
                >
                  <IconButton>
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell align="center">5</TableCell>
              <TableCell align="center">50</TableCell>
              <TableCell align="center">Unlimited</TableCell>
            </TableRow>

            <TableRow>
              <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Queries/month
                <Tooltip
                  title="Number of AI queries you can make per month"
                  arrow
                >
                  <IconButton>
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell align="center">100</TableCell>
              <TableCell align="center">1,000</TableCell>
              <TableCell align="center">Unlimited</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Storage</TableCell>
              <TableCell align="center">50 MB</TableCell>
              <TableCell align="center">1GB</TableCell>
              <TableCell align="center">Unlimited</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>AI Model</TableCell>
              <TableCell align="center">GPT-4.1 Mini</TableCell>
              <TableCell align="center">GPT-4.1 Mini</TableCell>
              <TableCell align="center">GPT-4.1 + Custom</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Text Embedding Model</TableCell>
              <TableCell align="center">text-embedding-small</TableCell>
              <TableCell align="center">text-embedding-large</TableCell>
              <TableCell align="center">text-embedding-large</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>SSO / SAML</TableCell>
              <TableCell align="center"> --- </TableCell>
              <TableCell align="center"> --- </TableCell>
              <TableCell align="center">
                <Check />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Support</TableCell>
              <TableCell align="center">Community</TableCell>
              <TableCell align="center">Priority</TableCell>
              <TableCell align="center">24/7 Dedicated</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
