"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  Sparkles,
  Check,
  ArrowRight,
  Play,
  Pause,
  Clock,
  RotateCcw,
  Mic,
  Volume2,
  BrainCircuit,
  FileText,
  ShieldCheck,
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

type ExaminerId = "methodology" | "novelty" | "limitations"

interface ExaminerData {
  id: ExaminerId
  name: string
  title: string
  role: string
  focus: string
  question: string
  candidateResponse: string
  critique: string
  feedbackType: "strong" | "nuance" | "stellar"
  rigorScore: string
  readinessTag: string
}

const EXAMINERS: Record<ExaminerId, ExaminerData> = {
  methodology: {
    id: "methodology",
    name: "Dr. Eleanor Vance",
    title: "Reader in Quantitative Methodology",
    role: "Internal Examiner",
    focus: "Sampling, statistical power & threats to validity",
    question:
      '"In Chapter 3, you selected a sample size of N=42 across two cohorts. How do you defend against selection bias, and why wasn\'t a non-parametric Bayesian approach adopted given the skew in your outcome variables?"',
    candidateResponse:
      '"We addressed cohort selection by implementing propensity score matching and conducting sensitivity analyses. We also performed a post-hoc power calculation (1 - β = 0.86) to confirm statistical power remained robust despite the distribution skew..."',
    critique:
      "Defensible answer! You firmly justified the power calculation. Recommendation: Explicitly cite Cohen (1988) or Austin (2011) to solidify the propensity matching justification when asked in person.",
    feedbackType: "strong",
    rigorScore: "94% Academic Rigor",
    readinessTag: "Ready for Defense",
  },
  novelty: {
    id: "novelty",
    name: "Prof. Marcus Thornton",
    title: "Chair of Computing & External Reviewer",
    role: "External Examiner",
    focus: "Theoretical novelty & state-of-the-art benchmarks",
    question:
      '"If the committee accepts your experimental findings, what is the single most distinct theoretical contribution of your dissertation compared to the 2024 benchmark by Patel et al.?"',
    candidateResponse:
      '"While Patel et al. demonstrated convergence on synthetic benchmarks, our work introduces the first provably bounded adaptive learning rate that operates without assuming stationarity, reducing real-world variance by 31%..."',
    critique:
      "Exceptional clarity on original contribution. Crisp contrast against Patel et al. without sounding dismissive of their prior literature.",
    feedbackType: "stellar",
    rigorScore: "98% Novelty Articulation",
    readinessTag: "Distinction Potential",
  },
  limitations: {
    id: "limitations",
    name: "Dr. Amara Chen",
    title: "Senior Faculty & Examination Chair",
    role: "Panel Chair",
    focus: "Boundary conditions, study limitations & future agenda",
    question:
      '"Every PhD has its boundaries. Looking back at Chapter 5, what is the most significant vulnerability in your experimental setup that you would overturn if granted another year of funding?"',
    candidateResponse:
      '"The most notable boundary condition is that our pipeline was tested strictly on English-language corpora. With an additional year, I would generalize across low-resource morphological languages to validate cross-lingual invariance..."',
    critique:
      "Honest academic posture. Acknowledging boundary conditions demonstrates scholarly maturity rather than weakness. Keep this exact tone in the real room.",
    feedbackType: "nuance",
    rigorScore: "96% Scholarly Maturity",
    readinessTag: "Pass with No Corrections",
  },
}

export function HeroSection() {
  const [activeExaminer, setActiveExaminer] = React.useState<ExaminerId>("methodology")
  const [timerMode, setTimerMode] = React.useState<"qa" | "presentation">("qa")
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(180) // 3 mins default
  const [isTimerRunning, setIsTimerRunning] = React.useState<boolean>(true)

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, secondsRemaining])

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning)
  const resetTimer = (mode: "qa" | "presentation") => {
    setTimerMode(mode)
    setSecondsRemaining(mode === "qa" ? 180 : 900)
    setIsTimerRunning(true)
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remSecs = secs % 60
    return `${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`
  }

  const current = EXAMINERS[activeExaminer]

  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Ambient Lighting & Academic Violet/Indigo Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-tr from-primary/25 via-indigo-600/20 to-sky-500/10 blur-[150px] rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-[450px] h-[450px] bg-gradient-to-bl from-purple-500/15 via-indigo-500/10 to-transparent blur-[130px] rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md">
            <GraduationCap className="size-3.5 text-primary" />
            <span>AI Mock Oral Defense Chamber for Master&apos;s & PhD Candidates</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground font-heading leading-[1.1]">
            Defend Your Thesis With{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-violet-300 bg-clip-text text-transparent">
              Absolute Confidence
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Step into the <strong>Viva Booth</strong>. Upload your dissertation or defense slides, face simulated committee members trained on your research, and master tough oral questions before your actual viva voce.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-8 font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all">
                <span>Start Mock Viva Free</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#showcase" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 border-border/80 hover:bg-muted/80"
              >
                <Play className="size-3.5 fill-current" />
                <span>Explore Interactive Defense Booth</span>
              </Button>
            </a>
          </div>

          {/* Micro Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>100% Confidential & Unpublished Data Safe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-4 text-emerald-400" />
              <span>Upload PDF, Word or Slide Decks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-4 text-emerald-400" />
              <span>Spoken Voice & Real-Time Rubric Scoring</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive App Preview: THE VIVA BOOTH CHAMBER */}
        <div id="showcase" className="mt-14 relative mx-auto max-w-5xl rounded-2xl border border-border/80 bg-gradient-to-b from-card/90 to-card/40 p-2 sm:p-4 backdrop-blur-xl shadow-2xl shadow-black/60 scroll-mt-24">
          <div className="rounded-xl border border-border/60 bg-background/95 overflow-hidden">
            {/* Simulated Booth Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-border/50 px-4 py-3 bg-muted/40 gap-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-500/80" />
                  <div className="size-3 rounded-full bg-yellow-500/80" />
                  <div className="size-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground ml-2 hidden sm:inline">
                  vivabooth.app/session/phd-oral-defense#live-chamber
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Oral Defense Active • Voice Audio Connected
                </Badge>
                <Badge variant="secondary" className="text-[11px] gap-1 font-mono text-muted-foreground hidden md:inline-flex">
                  <FileText className="size-3 text-primary" />
                  Thesis_Final_Draft.pdf (Indexed)
                </Badge>
              </div>
            </div>

            {/* Simulated Live Viva Chamber Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
              {/* Left Column: Examination Committee Roster (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Examination Board
                    </h4>
                    <span className="text-[11px] text-primary font-medium">3 Examiners</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveExaminer("methodology")}
                      className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                        activeExaminer === "methodology"
                          ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/40"
                          : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">Dr. Eleanor Vance</span>
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                          Methodology
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Internal Examiner • Statistical Rigor
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveExaminer("novelty")}
                      className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                        activeExaminer === "novelty"
                          ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/40"
                          : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">Prof. Marcus Thornton</span>
                        <Badge variant="outline" className="text-[10px] border-indigo-400/40 text-indigo-400">
                          Novelty
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        External Examiner • Prior Literature Skeptic
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveExaminer("limitations")}
                      className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                        activeExaminer === "limitations"
                          ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/40"
                          : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">Dr. Amara Chen</span>
                        <Badge variant="outline" className="text-[10px] border-emerald-400/40 text-emerald-400">
                          Chair
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Committee Chair • Scope & Contribution
                      </span>
                    </button>
                  </div>
                </div>

                {/* Real-time Defense Diagnostics */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <BrainCircuit className="size-3.5 text-primary" />
                      Candidate Defense Score
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold">{current.rigorScore}</span>
                  </div>
                  <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[94%]" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Predicted Outcome:</span>
                    <span className="text-foreground font-semibold flex items-center gap-1">
                      <Award className="size-3 text-amber-400" />
                      {current.readinessTag}
                    </span>
                  </div>
                </div>

                {/* Defense Time Management HUD */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      Defense Timekeeper
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/40">
                      {timerMode === "qa" ? "3-Min Q&A Drill" : "15-Min Slide Pitch"}
                    </Badge>
                  </div>

                  {/* Timer Display & Controls */}
                  <div className="flex items-center justify-between bg-background/80 p-2.5 rounded-md border border-border/50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Time Remaining</span>
                      <div className="font-mono text-xl font-bold tracking-wider text-foreground flex items-center gap-1.5">
                        <span className={secondsRemaining < 30 ? "text-red-400 animate-pulse" : "text-emerald-400"}>
                          {formatTime(secondsRemaining)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          / {timerMode === "qa" ? "03:00" : "15:00"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleTimer}
                        className="size-7 p-0 text-foreground hover:bg-muted"
                        title={isTimerRunning ? "Pause timer" : "Resume timer"}
                      >
                        {isTimerRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resetTimer(timerMode)}
                        className="size-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Reset timer"
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => resetTimer("qa")}
                      className={`text-[11px] py-1 px-2 rounded font-medium transition-all ${
                        timerMode === "qa"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Oral Q&amp;A (3m)
                    </button>
                    <button
                      type="button"
                      onClick={() => resetTimer("presentation")}
                      className={`text-[11px] py-1 px-2 rounded font-medium transition-all ${
                        timerMode === "presentation"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Slides Intro (15m)
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-tight">
                    ⚡ <strong>Pacing Target:</strong> Concise 90–120s answers prevent committee fatigue and maintain defense momentum.
                  </p>
                </div>
              </div>

              {/* Center & Right Column: Interactive Defense Stage (8 cols) */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                {/* Examiner Question Box */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {current.name.split(" ")[1]?.[0] || "E"}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {current.name}
                          <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                            ({current.role})
                          </span>
                        </h4>
                        <p className="text-[11px] text-primary">{current.focus}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1 text-[11px] border border-border/50">
                      <Volume2 className="size-3 text-primary animate-pulse" />
                      Speaking Question
                    </Badge>
                  </div>

                  <blockquote className="text-sm sm:text-base font-serif italic text-foreground/90 pl-3 border-l-2 border-primary/50 leading-relaxed">
                    {current.question}
                  </blockquote>

                  {/* Simulated audio waveform */}
                  <div className="mt-3 flex items-center gap-1.5 opacity-60">
                    <div className="h-2 w-1 bg-primary rounded-full animate-bounce" />
                    <div className="h-4 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="h-3 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="h-5 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
                    <div className="h-2 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                    <div className="h-4 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.25s]" />
                    <span className="text-[10px] text-muted-foreground ml-2 font-mono">00:14 / Question Audio</span>
                  </div>
                </div>

                {/* Candidate Response Transcript */}
                <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Mic className="size-3.5 text-emerald-400" />
                      Your Spoken Defense Transcript
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">Pacing: 138 WPM (Optimal)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/40">
                    {current.candidateResponse}
                  </p>
                </div>

                {/* Real-time AI Committee Critique */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-foreground flex items-start gap-2.5">
                  <Sparkles className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-400 block font-semibold mb-0.5">
                      AI Committee Feedback & Recommendation:
                    </strong>
                    <span className="text-muted-foreground leading-normal">{current.critique}</span>
                  </div>
                </div>

                {/* Booth Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="default" className="gap-1.5 text-xs bg-primary hover:bg-primary/90 font-medium">
                      <Mic className="size-3.5" />
                      <span>Hold to Speak Defense</span>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <RefreshCw className="size-3" />
                      <span>Grill Follow-up</span>
                    </Button>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="size-3 text-amber-400" />
                    <span>Click any examiner on the left to switch questions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
