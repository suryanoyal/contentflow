import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ContentFlow — Social Media Content Management",
  description: "Premium social media content management and auto-scheduling platform. Create, manage, and automatically schedule your social media content across all platforms.",
  keywords: ["social media", "content management", "scheduling", "marketing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-[var(--font-sans)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
