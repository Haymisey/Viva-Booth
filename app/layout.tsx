import type { Metadata } from "next";
import { Newsreader, Noto_Sans_Ethiopic } from "next/font/google";
import { VoiceRoot } from "@/components/booth/VoiceRoot";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
});

const ethiopic = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500"],
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
      <body className={`${newsreader.variable} ${ethiopic.variable} antialiased`}>
        {children}
        <VoiceRoot />
      </body>
    </html>
  );
}
