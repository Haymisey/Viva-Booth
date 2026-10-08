import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/marketing";

export const metadata: Metadata = {
  title: "VivaBooth | AI Thesis Defense & Oral Viva Voce Chamber",
  description:
    "Master your thesis or dissertation defense. Upload your research, face simulated academic examiners, practice tricky oral questions, and defend your degree with confidence.",
  openGraph: {
    title: "VivaBooth — AI Mock Oral Defense for Master's & PhD Candidates",
    description:
      "Step into the Viva Booth. Face simulated academic examiners trained on your research, analyze voice cadence, and eliminate defense anxiety.",
    type: "website",
    url: "https://vivabooth.app",
    siteName: "VivaBooth",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
