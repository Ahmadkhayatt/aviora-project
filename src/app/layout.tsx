import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | AVIORA",
    default: "AVIORA — Timeless Elegance, Crafted to Perfection",
  },
  description:
    "Discover our exquisite collection of fine jewelry and rings. AVIORA offers engagement rings, wedding bands, and luxury accessories crafted from premium materials.",
  keywords: [
    "jewelry", "engagement rings", "wedding bands", "luxury rings",
    "diamond rings", "gold jewelry", "platinum rings", "fine jewelry",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AVIORA",
    title: "AVIORA — Timeless Elegance, Crafted to Perfection",
    description:
      "Discover our exquisite collection of fine jewelry and rings.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-charcoal-50 font-sans text-charcoal-900 antialiased">
        {children}
      </body>
    </html>
  );
}
