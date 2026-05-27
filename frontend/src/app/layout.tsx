import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_BASE_PATH
    ? `https://enzoabuliak.github.io${process.env.NEXT_PUBLIC_BASE_PATH}`
    : "https://enzoabuliak.github.io/F1PitWall");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "F1 Pit Wall · Engineering Dashboard",
  description:
    "Real-time Formula 1 race engineering dashboard inspired by the Ferrari pit wall. Live timing, telemetry, strategy, and track map — powered by OpenF1 and Ergast.",
  applicationName: "F1 Pit Wall",
  keywords: [
    "Formula 1",
    "F1",
    "live timing",
    "telemetry",
    "OpenF1",
    "Ergast",
    "race strategy",
    "pit wall",
  ],
  authors: [{ name: "Enzo Abuliak" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "F1 Pit Wall · Real-time F1 Engineering Dashboard",
    description:
      "Live timing, telemetry, race control, and strategy modelling for every Grand Prix. Built on OpenF1 + Ergast.",
    siteName: "F1 Pit Wall",
  },
  twitter: {
    card: "summary_large_image",
    title: "F1 Pit Wall · Real-time F1 Engineering Dashboard",
    description:
      "Live timing, telemetry, race control, and strategy modelling for every Grand Prix.",
  },
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg`, type: "image/svg+xml" }],
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
