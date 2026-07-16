import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import ClockWidget from "@/components/ClockWidget";
import Toaster from "@/components/Toaster";
import { dailyCatalogItemWithImages, catalogImageUrl } from "@/lib/catalog";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dos&Go Relojes | Tienda Oficial",
  description: "Descubre nuestra colección exclusiva de relojes de alta calidad. Cronógrafos, deportivos, clásicos y más. Envío a toda Europa.",
  keywords: "relojes, relojería, cronógrafos, relojes deportivos, relojes de lujo, Dos&Go",
  openGraph: {
    title: "Dos&Go Relojes",
    description: "Relojes de alta calidad para cada momento de tu vida.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dailyItem = dailyCatalogItemWithImages();
  const daily = dailyItem
    ? { brand: dailyItem.brand, sku: dailyItem.sku, url: catalogImageUrl(dailyItem.sku) }
    : null;

  return (
    <html lang="es" className={`h-full antialiased ${playfair.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-white" style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        <ClockWidget daily={daily} />
        <Toaster />
      </body>
    </html>
  );
}
