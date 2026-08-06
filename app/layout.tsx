import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap"
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "LivretV — Apprendre la robotique ROS 2",
    template: "%s · LivretV"
  },
  description:
    "Plateforme d'apprentissage de la robotique ROS 2 : 6 parcours, un catalogue de composants, un laboratoire de câblage avec validation, un simulateur de graphe de nœuds et un générateur de projet ROS 2 complet.",
  keywords: [
    "ROS 2",
    "robotique",
    "Jazzy",
    "Nav2",
    "SLAM",
    "micro-ROS",
    "apprentissage"
  ],
  authors: [{ name: "LivretV" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "LivretV — Apprendre la robotique ROS 2",
    description:
      "De la première ligne de code au robot complet : théorie, composants, câblage validé et génération de projet.",
    images: [{ url: "/images/og.png", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#08080c",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
