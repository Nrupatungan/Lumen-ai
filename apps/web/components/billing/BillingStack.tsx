"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { Check, CreditCard, Receipt } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useBilling } from "@/hooks/useBilling";
import { PLAN_POLICY } from "@repo/policy/plans";

export default function BillingStack() {
  const router = useRouter();
  const { subscription, payments, isLoading } = useBilling();

  if (isLoading) {
    return (
      <Stack spacing={2} maxWidth={900}>
        <Typography>Loading billing details…</Typography>
      </Stack>
    );
  }

  if (!subscription) {
    return (
      <Stack spacing={2} maxWidth={900}>
        <Typography variant="h6">
          Either you are not signed in. Or you have not made any subrscription
          purchase
        </Typography>
        <Typography color="text.secondary">
          Please sign in to view billing details or purchase a subscription.
        </Typography>
        <Box sx={{ display: "inline-flex", gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => router.push("/sign-in")}
            sx={{
              textTransform: "inherit",
            }}
          >
            Sign in
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push("/pricing")}
            sx={{
              bgcolor: "turquoise",
              textTransform: "inherit",
            }}
          >
            Purchase
          </Button>
        </Box>
      </Stack>
    );
  }

  const currentPlan = PLAN_POLICY[subscription.plan];

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={600}>
          Billing & Subscription
        </Typography>
        <Typography color="text.secondary">
          Manage your subscription and payment history.
        </Typography>
      </Box>

      {/* Current Plan */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6">Current Plan</Typography>
              <Chip
                label={subscription.plan}
                color={subscription.plan === "Free" ? "default" : "primary"}
              />
            </Stack>
          }
          subheader={`Status: ${subscription.status}`}
        />

        <CardContent>
          <Stack spacing={2}>
            <Typography>
              Price:{" "}
              <strong>
                {currentPlan.pricing.price === 0
                  ? "Free"
                  : `$${currentPlan.pricing.price} / month`}
              </strong>
            </Typography>

            <Divider />

            <Typography fontWeight={500}>Plan Features</Typography>

            <Stack spacing={1}>
              <Feature
                label={`Max documents: ${currentPlan.documents.maxDocuments}`}
              />
              <Feature label={`Queries: ${currentPlan.chat.queries}`} />
              <Feature label={`Model: ${currentPlan.chat.model}`} />
              <Feature
                label={`Streaming: ${currentPlan.chat.streaming ? "Yes" : "No"}`}
              />
            </Stack>

            {subscription.plan !== "Pro" && (
              <Button
                variant="contained"
                sx={{
                  alignSelf: "flex-start",
                  mt: 2,
                  textTransform: "inherit",
                }}
                onClick={() => router.push("/pricing")}
              >
                Upgrade Plan
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <CreditCard />
              <Typography variant="h6">Payment Method</Typography>
            </Stack>
          }
        />
        <CardContent>
          {subscription.plan === "Free" ? (
            <Typography color="text.secondary">
              No payment method required for Free plan.
            </Typography>
          ) : (
            <Typography>
              Managed via Razorpay. You can update payment details during
              checkout.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <Receipt />
              <Typography variant="h6">Billing History</Typography>
            </Stack>
          }
        />

        <CardContent>
          {payments.length === 0 ? (
            <Typography color="text.secondary">No payments yet.</Typography>
          ) : (
            <Stack spacing={2}>
              {payments.map((p, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box>
                    <Typography fontWeight={500}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {p.status}
                    </Typography>
                  </Box>

                  <Typography fontWeight={600}>
                    {p.currency} {p.amount}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Check color="primary" fontSize="small" />
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}
