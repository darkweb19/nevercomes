import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/cart/CartDrawer";

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

// Set the theme class before first paint to avoid a flash. Dark ("carbon") is the
// shipped default; a stored preference (nc-theme) overrides it. Kept inline + tiny.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('nc-theme');var d=t?t==='dark':true;var c=document.documentElement.classList;d?c.add('theme-dark'):c.remove('theme-dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`theme-dark ${display.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="bg-page text-fg font-sans">
        {children}
        {/* Mounted once so any page's header can open the cart drawer. */}
        <CartDrawer />
      </body>
    </html>
  );
}
