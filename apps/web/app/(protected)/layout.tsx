import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ToastProvider } from "@/components/ToastProvider";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return <ToastProvider>{children}</ToastProvider>;
}
