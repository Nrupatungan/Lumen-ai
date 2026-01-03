import { ReactNode } from "react";
import { auth } from "@/auth";
import { Box } from "@mui/material";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <Box component="main">
      <Navbar isAuthenticated={!!session} />
      {children}
      <Footer />
    </Box>
  );
}
