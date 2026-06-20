import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Dos&Go Relojes | Tienda Oficial",
  description: "Descubre nuestra colección exclusiva de relojes de alta calidad. Cronógrafos, deportivos, clásicos y más. Envío a toda España.",
  keywords: "relojes, relojería, cronógrafos, relojes deportivos, relojes de lujo, Dos&Go",
  openGraph: {
    title: "Dos&Go Relojes",
    description: "Relojes de alta calidad para cada momento de tu vida.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
