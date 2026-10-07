import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

export function FaqSection() {
  return (
    <section id="faq" className="py-20 border-t border-border/40 bg-muted/10 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
            Defense FAQs
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about preparing for your viva voce with VivaBooth.
          </p>
        </div>

        <Accordion className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is my unpublished thesis and research data kept strictly confidential?</AccordionTrigger>
            <AccordionContent>
              Yes, 100%. Academic intellectual property is paramount. Your dissertation, drafts, methodology notes,
              and audio recordings are fully encrypted (AES-256 at rest, TLS 1.3 in transit), isolated to your
              private workspace, and never shared or used to train public AI models. You retain total ownership of your work.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>How does VivaBooth know what my specific examiners will ask?</AccordionTrigger>
            <AccordionContent>
              VivaBooth performs deep semantic indexing across your entire manuscript. It identifies theoretical
              assumptions, sampling constraints, statistical distributions, and unaddressed counter-arguments in your literature
              review. It then simulates the exact cross-examination strategies trained on thousands of real-world PhD and Master&apos;s defenses.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Can I practice speaking my answers or do I have to type?</AccordionTrigger>
            <AccordionContent>
              Both modes are available! In Voice Mode, simulated examiners verbalize questions aloud, and you defend using
              your microphone. VivaBooth transcribes your speech in real time, assessing your pacing (words per minute),
              filler-word count, and academic composure under pressure.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Does VivaBooth support both STEM and Humanities / Social Sciences?</AccordionTrigger>
            <AccordionContent>
              Yes. In STEM disciplines, examiners focus heavily on empirical rigor, statistical power, error margins, and
              algorithmic complexity. In the Humanities and Social Sciences, examiners probe qualitative methodology,
              epistemological positioning, thematic saturation, and theoretical contributions.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>Can I customize the personalities to match my real committee?</AccordionTrigger>
            <AccordionContent>
              Absolutely. You can choose examiner archetypes—such as the Skeptical External Reviewer, the Pedantic Methodologist,
              the Supportive Internal Mentor, or the Interdisciplinary Panel Chair—and calibrate their rigor from constructive to intense.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>What degree levels does VivaBooth support?</AccordionTrigger>
            <AccordionContent>
              VivaBooth supports all levels of thesis defense: Doctoral dissertations (PhD, DPhil, EdD, DBA), Master&apos;s theses
              (MSc, MA, MPhil, MRes), and Senior Undergraduate honors capstone projects.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}
