import * as React from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/40 py-12 text-muted-foreground text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-3.5" />
          </div>
          <span className="font-heading font-semibold text-foreground">VivaBooth</span>
          <span className="hidden sm:inline">• The AI Thesis &amp; Viva Voce Defense Platform</span>
          <span>© 2026. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
          <Link
            href="/auth/signin"
            className="hover:text-foreground transition-colors text-primary font-medium"
          >
            Candidate Portal
          </Link>
        </div>
      </div>
    </footer>
  )
}
