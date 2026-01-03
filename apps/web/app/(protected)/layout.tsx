import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Box } from "@mui/material";
import Navbar from "@/components/layout/Navbar";

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

  return (
    <Box minHeight="100vh">
      <Navbar isAuthenticated={!!session} />
      <Box component="main" p={3}>
        {children}
      </Box>
    </Box>
  );
}
