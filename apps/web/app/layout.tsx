import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Lumen AI",
  description: "Your personal AI-powered knowledge base",
};

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
