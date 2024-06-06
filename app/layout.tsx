import type { Metadata } from "next";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { shouldUseAuth } from "@/lib/shouldUseAuth";
import { Analytics } from "@/components/Analytics";

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
    <Provider>
      <html lang="en">
        <Analytics>
          <body className={cn("font-sans antialiased", fontSans.variable)}>
            {children}
          </body>
        </Analytics>
      </html>
    </Provider>
  );
}

function Provider({ children }: { children: React.ReactNode }) {
  if (shouldUseAuth) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }
  return <>{children}</>;
}
