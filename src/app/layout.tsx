import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "RentCheck — ¿Este piso está caro o es una oportunidad?",
  description:
    "Analiza cualquier anuncio de alquiler y descubre si el precio está inflado o por debajo del mercado. Radar de oportunidades incluido.",
  keywords: ["alquiler", "piso", "barcelona", "precio", "análisis", "mercado"],
  authors: [{ name: "RentCheck" }],
  openGraph: {
    title: "RentCheck — ¿Este piso está caro o es una oportunidad?",
    description:
      "Analiza cualquier anuncio de alquiler y descubre si el precio está inflado o por debajo del mercado.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
