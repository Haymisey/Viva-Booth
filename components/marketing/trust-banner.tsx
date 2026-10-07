import * as React from "react"
import { GraduationCap } from "lucide-react"

export function TrustBanner() {
  return (
    <section className="border-y border-border/40 bg-muted/20 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <GraduationCap className="size-4 text-primary" />
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Trusted by researchers, PhD candidates & graduate scholars from leading institutions
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75">
          <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-foreground">
            OXFORD
          </span>
          <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-foreground">
            CAMBRIDGE
          </span>
          <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-foreground">
            STANFORD
          </span>
          <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-foreground">
            HARVARD
          </span>
          <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-foreground">
            MIT
          </span>
          <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-foreground">
            ETH ZÜRICH
          </span>
          <span className="font-heading font-bold text-base sm:text-lg tracking-wider text-foreground">
            IMPERIAL COLLEGE
          </span>
        </div>
      </div>
    </section>
  )
}
