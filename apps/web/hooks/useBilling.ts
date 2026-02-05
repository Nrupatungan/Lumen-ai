"use client";

import { api } from "@/lib/apiClient";
import { Plan } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type BillingSubscription = {
  plan: Plan;
  status: "active" | "expired" | "cancelled";
  startDate?: string;
  endDate?: string;
};

export type BillingPayments = {
  id: string;
  amount: number;
  currency: string;
  status: "created" | "success" | "failed";
  createdAt: string;
};

export function useBilling(): {
  subscription: BillingSubscription | null;
  payments: BillingPayments[];
  isLoading: boolean;
} {
  const subscriptionQuery = useQuery<BillingSubscription | null>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await api.get("/payments/subscription");
      return res.data?.subscription ?? null;
    },
    retry: false,
  });

  const paymentsQuery = useQuery<BillingPayments[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get("/payments");
      return res.data?.payments;
    },
    retry: false,
  });

  return {
    subscription: subscriptionQuery.data ?? null,
    payments: paymentsQuery.data ?? [],
    isLoading: subscriptionQuery.isLoading || paymentsQuery.isLoading,
  };
}
