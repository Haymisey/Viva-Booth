import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_Ethiopic } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-ethiopic",
  weight: ["400", "500", "600"],
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
        "dark h-full antialiased scroll-smooth",
        inter.variable,
        geistMono.variable,
        ethiopic.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
