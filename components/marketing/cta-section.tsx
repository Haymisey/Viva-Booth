import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, GraduationCap } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/20 via-indigo-600/15 to-violet-600/20 p-8 sm:p-12 text-center backdrop-blur-xl shadow-2xl">
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-primary mb-2 shadow-inner">
              <GraduationCap className="size-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">
              Step into your defense room without the fear of the unknown.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Join thousands of PhD candidates and Master&apos;s researchers who transformed defense anxiety into calm, articulate authority with VivaBooth.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 font-semibold shadow-lg shadow-primary/25">
                  <span>Enter the Viva Booth Free</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#showcase" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Sample Defense Session
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
