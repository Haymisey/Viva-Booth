import { Navbar } from "@/components/navbar"
import {
  HeroSection,
  TrustBanner,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
  FaqSection,
  CtaSection,
  Footer,
} from "@/components/sections"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Horizontal Nav Bar with Icon on Most Left and Links + Login on Most Right */}
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
  )
}
