"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { Payments } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface BillingCardProps {
  plan: string;
  status?: "active" | "trialing" | "canceled";
  currentPeriodEnd?: string;
}

export default function BillingCard({
  plan,
  status,
  currentPeriodEnd,
}: BillingCardProps) {
  const router = useRouter();

  const statusColor =
    status === "active"
      ? "success"
      : status === "trialing"
        ? "warning"
        : "default";

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Billing
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          <InfoRow label="Current plan" value={plan} />

          {status && (
            <InfoRow
              label="Status"
              value={
                <Chip
                  size="small"
                  label={status.toUpperCase()}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  color={statusColor as any}
                />
              }
            />
          )}

          {currentPeriodEnd && (
            <InfoRow
              label="Renews on"
              value={new Date(currentPeriodEnd).toLocaleDateString()}
            />
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Button
          fullWidth
          variant="outlined"
          startIcon={<Payments />}
          onClick={() => router.push("/pricing")}
        >
          Manage Billing
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}
