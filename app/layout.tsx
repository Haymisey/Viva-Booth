import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = localFont({
  src: "../fonts/Inter-Variable.ttf",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/JetBrainsMono-Variable.ttf",
  variable: "--font-geist-mono",
  weight: "100 800",
  display: "swap",
});

const ethiopic = localFont({
  src: "../fonts/NotoSansEthiopic-Variable.ttf",
  variable: "--font-ethiopic",
  weight: "100 900",
  display: "swap",
});

const instrument = localFont({
  src: [
    {
      path: "../fonts/InstrumentSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/InstrumentSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
});

const manrope = localFont({
  src: "../fonts/Manrope-Variable.ttf",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VivaBooth · AI Thesis Defense",
    template: "%s · Viva-Booth",
  },
  description:
    "Master your thesis or dissertation defense. Upload your research, face simulated academic examiners, practice tricky oral questions, and defend your degree with confidence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased scroll-smooth",
        inter.variable,
        geistMono.variable,
        ethiopic.variable,
        instrument.variable,
        manrope.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
