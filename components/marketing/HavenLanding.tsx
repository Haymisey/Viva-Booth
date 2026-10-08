"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  Headphones,
  Pause,
  Play,
  Quote,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/viva/SiteHeader";
import { Wordmark } from "@/components/viva/Wordmark";
import "./haven.css";

const passages = [
  {
    title: "Your argument, in your own words.",
    transcript:
      "“The central argument of my research is that the archive tells a more complex story than the existing literature suggests.”",
    citation: "Chapter two · Archival evidence",
    feedback: "A clear opening. Now connect the evidence to your central claim.",
  },
  {
    title: "Make room for a better question.",
    transcript:
      "“One limitation of my approach is the scope of the source material. I chose depth over breadth to preserve the context of each account.”",
    citation: "Methodology · Research scope",
    feedback: "Thoughtful and specific. Explain why this trade-off matters to your findings.",
  },
  {
    title: "Let your evidence do the talking.",
    transcript:
      "“These findings build on previous scholarship, but the correspondence reveals a connection that has not been examined in detail.”",
    citation: "Chapter three · Correspondence",
    feedback: "Your contribution is coming through. Name the connection before expanding on it.",
  },
];

function PracticePreview() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(252);
  const [sample, setSample] = useState(0);
  const passage = passages[sample];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <div className="practice-preview" id="viva-preview">
      <div className="preview-top">
        <span>
          <span className="status-dot" /> {running ? "Practice in progress" : "A moment inside Viva"}
        </span>
        <span className="sample-label">
          Sample session <ArrowUpRight size={13} />
        </span>
      </div>
      <div className="preview-main">
        <div className="preview-intro">
          <span className="eyebrow">YOUR VOICE, WITH CONFIDENCE</span>
          <h3>{passage.title}</h3>
          <p>
            Read first. Then listen.
            <br />
            Stay grounded in your work.
          </p>
          <div className="sample-switch" aria-label="Choose sample">
            {passages.map((_, i) => (
              <button
                key={i}
                type="button"
                className={sample === i ? "sample-dot active" : "sample-dot"}
                aria-label={`Sample ${i + 1}`}
                aria-pressed={sample === i}
                onClick={() => setSample(i)}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
        <div className="preview-timer">
          <span className="timer-numerals">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}
            <span>:</span>
            {String(seconds % 60).padStart(2, "0")}
          </span>
          <div className="timer-controls">
            <button type="button" className="viva-button" onClick={() => setRunning((value) => !value)}>
              {running ? <Pause /> : <Play />}
              {running ? "Pause" : "Start practice"}
            </button>
            <button
              type="button"
              className="quiet-button"
              aria-label="Reset practice timer"
              onClick={() => {
                setRunning(false);
                setSeconds(252);
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <span className={`sound-wave ${running ? "playing" : ""}`} aria-hidden="true">
            {Array.from({ length: 25 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </div>
      </div>
      <div className="preview-columns">
        <section>
          <span className="column-label">
            <AudioLines size={15} /> Transcript
          </span>
          <p key={`t${sample}`} className="sample-copy">
            {passage.transcript}
          </p>
        </section>
        <section>
          <span className="column-label">
            <Quote size={15} /> Citations
          </span>
          <p key={`c${sample}`} className="sample-copy">
            {passage.citation}
          </p>
          <span className="citation-badge">
            <Check size={11} /> In your sources
          </span>
        </section>
        <section>
          <span className="column-label">
            <span className="tiny-spark">✧</span> A clearer way to say it
          </span>
          <p key={`f${sample}`} className="sample-copy">
            {passage.feedback}
          </p>
        </section>
      </div>
    </div>
  );
}

export function HavenLanding() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <img src="/paper-study.jpg" alt="" className="hero-art" width={1920} height={1024} />
          <h1 className="reveal">
            Viva.
            <br />
            Find your <em>voice.</em>
          </h1>
          <p className="hero-description reveal delay-two">
            You’ve done the thinking. Now, make it heard.
            <br />
            A calm space to practice, reflect, and speak with confidence.
          </p>
          <div className="hero-actions reveal delay-two">
            <Link href="/practice" className="viva-button">
              Begin your practice <ArrowUpRight size={16} />
            </Link>
            <button
              type="button"
              className="quiet-button"
              onClick={() =>
                document.getElementById("viva-preview")?.scrollIntoView({
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                })
              }
            >
              Take a quiet look <ArrowDown size={14} />
            </button>
          </div>
          <p className="hero-footnote reveal delay-two">
            Your research. Your pace.
            <span>·</span>
            No pressure.
          </p>
          <div className="hero-bottom reveal delay-two">
            <span>
              <BookOpen size={14} /> Grounded in your work
            </span>
            <i />
            <span>
              <Headphones size={14} /> Made for your voice
            </span>
            <i />
            <span>
              <ShieldCheck size={14} /> A space of your own
            </span>
          </div>
        </section>
        <section className="experience">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LESS NOISE. MORE CLARITY.</span>
              <h2>Room to think out loud.</h2>
            </div>
            <p>
              Not another answer to memorize.
              <br />
              A little more trust in your own.
            </p>
          </div>
          <PracticePreview />
          <div className="principles">
            <div>
              <span className="principle-number">01</span>
              <h3>Start with what you know.</h3>
              <p>Your research is the starting point. Keep your argument close to the work that made it.</p>
            </div>
            <div>
              <span className="principle-number">02</span>
              <h3>Let the words come.</h3>
              <p>Give your ideas a voice, without the pressure of getting every sentence perfect.</p>
            </div>
            <div>
              <span className="principle-number">03</span>
              <h3>Leave a little clearer.</h3>
              <p>Notice what holds, refine what doesn’t, and take that confidence into the conversation.</p>
            </div>
          </div>
        </section>
        <section className="closing">
          <h2>You know your work. Let it show.</h2>
          <p>Your next chapter starts with a conversation.</p>
          <Link href="/practice" className="viva-button">
            Make space for practice <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <Wordmark />
        <p>Read first. Then listen. Always your voice.</p>
      </footer>
    </>
  );
}
