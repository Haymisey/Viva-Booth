import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, Users2, Trophy } from "lucide-react"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 border-t border-border/40 bg-muted/10 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
            Simple 3-Step Process
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Your path from thesis submission to &ldquo;Passed with No Corrections&rdquo;
          </h2>
          <p className="text-sm text-muted-foreground">
            How VivaBooth transforms your pre-defense anxiety into poised academic eloquence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/40 transition-all">
            <div className="size-14 rounded-2xl bg-primary/15 border border-primary/40 text-primary font-bold text-lg flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="size-6 text-primary" />
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-primary font-semibold mb-1">
              Step 01
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              Upload Thesis or Slides
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your dissertation PDF, proposal, or presentation deck. Our secure engine indexes your arguments, methodology, and citations in under 60 seconds.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/40 transition-all">
            <div className="size-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 font-bold text-lg flex items-center justify-center mb-4 shadow-inner">
              <Users2 className="size-6 text-indigo-400" />
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-semibold mb-1">
              Step 02
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              Configure Your Committee
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select your academic discipline, degree level (Master&apos;s, PhD), and examiner archetypes—from friendly guidance to rigorous methodology cross-examination.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/40 transition-all">
            <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-lg flex items-center justify-center mb-4 shadow-inner">
              <Trophy className="size-6 text-emerald-400" />
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold mb-1">
              Step 03
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              Enter The Booth &amp; Defend
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Take the hot seat. Answer spoken or written questions under pressure, withstand tough follow-ups, and receive an instant defense readiness debrief.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
