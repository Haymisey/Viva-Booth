import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import { VoiceRoot } from "@/components/booth/VoiceRoot";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Viva",
  description:
    "Read the manuscript first. Then listen. Scholarxiv checks citations. Never invent a paper.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${newsreader.variable} antialiased`}>
        {children}
        <VoiceRoot />
      </body>
    </html>
  );
}
