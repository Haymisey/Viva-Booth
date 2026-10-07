import { Navbar } from "@/components/navbar";
import {
  HeroSection,
  TrustBanner,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
  FaqSection,
  CtaSection,
  Footer,
} from "@/components/marketing";

export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        <HeroSection />
        <TrustBanner />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
