import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
const sora = Sora({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Livret V",
  description: "Frontend-only demo using localStorage mock data"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} ${sora.variable}`}>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
