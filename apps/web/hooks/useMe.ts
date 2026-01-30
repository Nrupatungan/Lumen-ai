import { api } from "@/lib/apiClient";
import { Plan } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type Me = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: "admin" | "user";
  plan: Plan;
  createdAt: Date;
};

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await api.get("/users/me", {
          headers: { "Cache-control": "no-cache" },
        });
        return res.data?.userProfile ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.response?.status === 401) {
          throw err; // real unauthenticated
        }
        return null; // server error, but keep session
      }
    },
    retry: false,
  });
}
