import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RetroToast from "@/components/RetroToast";
import SecurityWrapper from "@/components/SecurityWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RetroFin 98",
  description: "Aplikasi Keuangan Bergaya Retro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 transition-colors`}>
        <SecurityWrapper>
          {children}
          <RetroToast />
        </SecurityWrapper>
      </body>
    </html>
  );
}