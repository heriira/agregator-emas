import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Inisialisai font menggunakan Inter
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Agregator Emas",
  description: "Bandingkan harga beli dan jual emas fisik & digital dari berbagai penyedia di dalam satu platform",
  icons:{
    icon: "/favicon.svg",
  }
};

/**
 * Layout dibuat minimal (hanya menampilkan html/body/font). Navbar & Footer publik dipindah ke app/(public)/layout.tsx, dan dashboard admin (app/admin/)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
