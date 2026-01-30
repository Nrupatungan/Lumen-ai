"use client";

import React from "react";
import { apiClient } from "@/lib/apiClient";
import { loadScript } from "@/utils";
import { Button, Typography } from "@mui/material";
import { Session } from "next-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INormalizeError } from "razorpay/dist/types/api";
import { useMe } from "@/hooks/useMe";
import { Plan } from "@/lib/types";

export interface PaymentButtonProps {
  tier: {
    name: Plan;
    popular: boolean;
    session: Session | null;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export default function PaymentButton({ tier }: PaymentButtonProps) {
  const router = useRouter();
  const { data: me, isLoading } = useMe();

  if (isLoading) return <Typography sx={{ mt: 4 }}>Loading...</Typography>;

  if (!me) {
    // User is not authenticated or profile unavailable
    return (
      <Button
        LinkComponent={Link}
        href="/sign-in"
        fullWidth
        variant="outlined"
        sx={{ mt: 4, textTransform: "inherit" }}
      >
        Sign in to continue
      </Button>
    );
  }

  async function displayRazorpay() {
    if (!tier.session?.user) {
      router.push("/sign-in");
      return;
    }

    const page = await loadScript(
      process.env.NEXT_PUBLIC_RAZORPAY_CHECKOUT_PAGE!,
    );

    if (!page) {
      alert("Razropay failed to load!!");
      return;
    }

    const order = await apiClient.createOrder({ plan: tier.name });

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Lumen AI",
      order_id: order.orderId,
      description: "Test Transaction",
      handler: async function (response: RazorpayResponse) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          response;

        const paymentValidation = await apiClient.verifyPayment({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          plan: tier.name,
        });

        if (paymentValidation.status === 200) {
          console.log(paymentValidation.data.message);
        }
      },
      prefill: {
        name: me?.name,
        email: me?.email,
      },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: INormalizeError) {
        alert(response.error.code);
        alert(response.error.description);
        alert(response.error.source);
        alert(response.error.step);
        alert(response.error.reason);
        alert(response.error.metadata);
      });
      rzp.open();
    } else {
      console.error("Razorpay script not loaded.");
    }

    router.push("/chat");
  }

  if (tier.name === "Free") {
    return (
      <Button
        LinkComponent={Link}
        href="/chat"
        fullWidth
        variant="outlined"
        sx={{
          mt: 4,
          textTransform: "inherit",
        }}
      >
        Get Started Free
      </Button>
    );
  }

  return (
    <Button
      fullWidth
      variant={tier.popular ? "contained" : "outlined"}
      sx={{
        mt: 4,
        textTransform: "inherit",
      }}
      onClick={displayRazorpay}
    >
      Start Free Trial
    </Button>
  );
}
