import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import AppThemeProvider from "@/theme/ThemeContext";

export const metadata: Metadata = {
  title: "Lumen AI",
  description: "Your personal AI-powered knowledge base",
};

const roboto = localFont({
  src: [
    {
      path: "./fonts/Roboto-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Roboto-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Roboto-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Roboto-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],

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
      <body className={`${roboto.className}`}>
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <AppThemeProvider>
            <Providers>{children}</Providers>
          </AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
