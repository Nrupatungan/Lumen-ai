import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Providers from "./providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import AppThemeProvider from "@/theme/ThemeContext";

export const metadata: Metadata = {
  title: "Lumen AI",
  description: "Your personal AI-powered knowledge base",
};

const poppins = Roboto({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body className={`${poppins.className}`}>
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <AppThemeProvider>
            <Providers>{children}</Providers>
          </AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
