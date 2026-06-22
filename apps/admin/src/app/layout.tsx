import type { Metadata } from "next";
import { Geist, Geist_Mono, Anybody, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// NEW: Anybody for bold headers
const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

// NEW: Space Grotesk for labels
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ComfyTag Admin",
  description: "Event platform admin dashboard",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anybody.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning><Providers>{children}</Providers></body>
    </html>
  );
}
