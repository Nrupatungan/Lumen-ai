import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  // if (session.user.role !== "user") {
  //   redirect("/unauthorized");
  // }

  return <>{children}</>;
}
