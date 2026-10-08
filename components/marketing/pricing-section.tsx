import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Check, ShieldCheck } from "lucide-react"

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
            Student &amp; Researcher Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading">
            Simple, fair pricing for every defense deadline
          </h2>
          <p className="text-sm text-muted-foreground">
            Invest in peace of mind. One simple pass gets you fully prepared to face your examiners.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Master's Plan */}
          <Card className="flex flex-col justify-between border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-xl">Master&apos;s Sprint</CardTitle>
              <CardDescription>Ideal for MSc, MA, and undergraduate capstone defenses</CardDescription>
              <div className="pt-4 pb-2">
                <span className="text-4xl font-extrabold text-foreground">$29</span>
                <span className="text-xs text-muted-foreground ml-1">/ one-time (60-day access)</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>Up to 150-page thesis manuscript indexed</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>5 full-length mock viva simulations</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>2-Examiner committee simulation</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>100+ curated viva question flashcards</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>Methodology vulnerability check</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Link href="/auth/signup" className="w-full">
                <Button variant="outline" className="w-full">
                  Get Master&apos;s Pass
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* PhD Pro Tier (Popular) */}
          <Card className="relative flex flex-col justify-between border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-0.5">
                Most Popular for PhDs
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Doctoral Candidate Pro</CardTitle>
              <CardDescription>Comprehensive preparation for PhD, DPhil, and doctoral dissertations</CardDescription>
              <div className="pt-4 pb-2">
                <span className="text-4xl font-extrabold text-foreground">$59</span>
                <span className="text-xs text-muted-foreground ml-1">/ one-time (Unlimited until you pass)</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="size-4 text-primary" />
                <span>Full dissertation upload (unlimited pages)</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="size-4 text-primary" />
                <span>Unlimited mock viva defense sessions</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="size-4 text-primary" />
                <span>3-Examiner Panel (Internal, External &amp; Chair)</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="size-4 text-primary" />
                <span>Spoken voice mode with cadence &amp; filler analytics</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="size-4 text-primary" />
                <span>Deep literature gap &amp; counter-argument stress test</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="size-4 text-primary" />
                <span>Exportable defense cheatsheet &amp; answer guide</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Link href="/auth/signup" className="w-full">
                <Button className="w-full shadow-lg shadow-primary/20">
                  Get Doctoral Pro Access
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Institutional / Departmental */}
          <Card className="flex flex-col justify-between border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-xl">Graduate School &amp; Labs</CardTitle>
              <CardDescription>For university departments, research labs &amp; thesis advisors</CardDescription>
              <div className="pt-4 pb-2">
                <span className="text-4xl font-extrabold text-foreground">$199</span>
                <span className="text-xs text-muted-foreground ml-1">/ department / term</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>Multi-candidate cohort access</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>Faculty advisor readiness dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>Custom university defense rubric calibration</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>Enterprise FERPA/GDPR student data protection</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="size-4 text-primary" />
                <span>Dedicated academic onboarding &amp; training</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Link href="/auth/signup" className="w-full">
                <Button variant="outline" className="w-full">
                  Inquire for Department
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Confidentiality Guarantee */}
        <div className="mt-12 mx-auto max-w-xl p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-center gap-3 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
          <span>
            <strong>Academic Privacy Guarantee:</strong> Your research, dissertation drafts, and voice recordings are never stored publicly, never shared, and never used to train open LLM models.
          </span>
        </div>
      </div>
    </section>
  )
}
