import React from "react";
import { Box } from "@mui/material";
import Navbar from "@/components/layout/Navbar";
import { auth } from "@/auth";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <Box minHeight="100vh">
      <Navbar isAuthenticated={!!session} />
      {children}
    </Box>
  );
}
