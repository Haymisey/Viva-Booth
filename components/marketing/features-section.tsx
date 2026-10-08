import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  BrainCircuit,
  Mic,
  HelpCircle,
  Users,
  Award,
  Scale,
  Clock,
} from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
            Defense-Grade Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading">
            Engineered exclusively for thesis, master&apos;s &amp; doctoral oral defenses
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Traditional viva preparation relies on guesswork and awkward mock trials with busy advisors. VivaBooth reads your entire dissertation to challenge your specific arguments, data, and citations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-2">
                <BrainCircuit className="size-5" />
              </div>
              <CardTitle className="text-lg">Dissertation-Trained AI Panel</CardTitle>
              <CardDescription>
                Upload your thesis PDF or draft. Our engine indexes your literature review, methodology, and results to generate rigorous, context-aware examination questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Deep semantic comprehension of statistical tables, formulas, footnotes, and citation networks across STEM and humanities.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="size-10 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-2">
                <Mic className="size-5" />
              </div>
              <CardTitle className="text-lg">Spoken Voice Defense Booth</CardTitle>
              <CardDescription>
                Recreate the high-stakes oral atmosphere. AI committee members speak questions aloud, and you defend using your microphone under realistic countdown timers.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Includes real-time speech transcription, pacing analysis (WPM), and detection of excessive filler words or hesitation.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 mb-2">
                <Clock className="size-5" />
              </div>
              <CardTitle className="text-lg">Defense Time Management &amp; Pacing</CardTitle>
              <CardDescription>
                Master strict oral timing constraints. Practice delivering crisp 90–120s answers and rehearse your opening 15-minute presentation so examiners never cut you off.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Live countdown timers, speaking speed feedback (120–150 WPM target), and alerts for rambling or underspecified responses.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="size-10 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 mb-2">
                <Scale className="size-5" />
              </div>
              <CardTitle className="text-lg">Methodology Vulnerability Audit</CardTitle>
              <CardDescription>
                Uncover hidden methodological weaknesses, sample size limitations, or confounding variables before your external examiner catches them.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Provides bulletproof counter-defense scripts and recommended academic citations to defend unavoidable study boundaries.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="size-10 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400 mb-2">
                <HelpCircle className="size-5" />
              </div>
              <CardTitle className="text-lg">250+ Classic Viva Question Bank</CardTitle>
              <CardDescription>
                Practice the definitive questions asked at 95% of defenses: original contribution, alternative methodologies, theoretical frameworks, and research impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Organized by defense phase: Opening statement, literature context, methodology scrutiny, and future research roadmap.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 mb-2">
                <Users className="size-5" />
              </div>
              <CardTitle className="text-lg">Custom Examiner Personalities</CardTitle>
              <CardDescription>
                Configure your panel to match your real committee—from supportive mentors to razor-sharp skeptics, pedantic methodologists, and devil&apos;s advocates.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Adjust examiner hostility, academic domain expertise, and question depth from undergraduate capstone to PhD doctoral rigor.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-2">
                <Award className="size-5" />
              </div>
              <CardTitle className="text-lg">Instant Rubric &amp; Readiness Score</CardTitle>
              <CardDescription>
                Receive an objective post-defense debrief with rubric grades on clarity, scholarly posture, evidence citation, and confidence under pressure.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Generates an exportable revision cheatsheet with model answers and key talking points to review before defense day.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
