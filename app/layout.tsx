import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";

// Display (headlines, the stamp, and — per D4 — body copy).
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Mono for receipt/tracking-flavored text (prices, order IDs, ETAs, status lines).
const mono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeverComes",
  description: "All the dopamine of buying, none of the receipt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
