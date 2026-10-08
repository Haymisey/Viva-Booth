import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viva — Your work. Your words. Your confidence.",
  description:
    "A calm space to prepare for your viva. Practice your argument, stay grounded in your sources, and find confidence in your own voice.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="haven">{children}</div>;
}
