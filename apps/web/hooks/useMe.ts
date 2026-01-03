import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export type Me = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: "admin" | "user";
  plan: "Free" | "Go" | "Pro";
  createdAt: Date;
};

export function useMe(isAuthenticated: boolean) {
  return useQuery<Me>({
    queryKey: ["me", isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      return await apiClient.getUserDetails();
    },
    staleTime: 15 * 60 * 1000,
    retry: false, // don’t spam backend on auth failure
  });
}
