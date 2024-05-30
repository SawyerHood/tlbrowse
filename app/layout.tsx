import type { Metadata } from "next";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "tlbrowse",
  description: "an infinite canvas for the simulated web",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={cn("font-sans antialiased", fontSans.variable)}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
