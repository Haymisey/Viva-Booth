"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebriefPanel } from "@/components/booth/DebriefPanel";
import { SessionBar } from "@/components/booth/SessionBar";
import { startBrowserListen, type MicFailureReason } from "@/lib/browser-listen";
import {
  capSpeechCitations,
  citationsFromTexts,
  extractSpeechCitations,
  mergeCitations,
} from "@/lib/extract-citations";
import { requestDebrief } from "@/lib/request-debrief";
import { requestExtract } from "@/lib/request-extract";
import { bindVivaSession } from "@/lib/session-bridge";
import { mergeSpeech } from "@/lib/speech-clean";
import { verifyCitations } from "@/lib/verify-citations";
import { hushVoxide } from "@/lib/voxide-client";
import type { Citation, SessionPhase } from "@/lib/types";

const micErrorText: Record<MicFailureReason, string> = {
  unsupported: "Microphone speech recognition is not supported in this browser.",
  permission_denied: "Microphone access was denied. Allow microphone permission and try again.",
  unavailable: "No working microphone was found. Connect a microphone and retry.",
  network: "Microphone transcription lost connection. Check your network and retry.",
  start_failed: "Microphone could not start. Check your microphone setup and try again.",
  unknown: "Microphone failed while listening. Please try again.",
};

const apiErrorText: Record<"extract" | "verify" | "debrief", string> = {
  extract: "Citation extraction service failed. Results may be incomplete.",
  verify: "Citation verification service failed. Marked as unverified.",
  debrief: "Debrief service failed. Try again after the network recovers.",
};

export function Booth() {
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState("");
  const liveRef = useRef("");
  const [transcript, setTranscript] = useState("");
  const [checked, setChecked] = useState<Citation[] | null>(null);
  const [debrief, setDebrief] = useState("");
  const [errorText, setErrorText] = useState("");

  const reportError = useCallback((text: string) => {
    setErrorText(text);
    if (typeof window === "undefined") return;
    if (typeof SpeechSynthesisUtterance === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      /* keep the written error */
    }
  }, []);

  const resetSession = useCallback(() => {
    liveRef.current = "";
    setLive("");
    setTranscript("");
    setChecked(null);
    setDebrief("");
    setElapsed(0);
    setErrorText("");
  }, []);

  const runVerify = useCallback(async (list: Citation[], spokenText: string, seconds: number) => {
    setChecked(list);
    setDebrief("");

    const verified = await verifyCitations(list);
    setChecked(verified.citations);
    if (verified.failed) reportError(apiErrorText.verify);

    const debriefResult = await requestDebrief({
      transcript: spokenText,
      citations: verified.citations,
      seconds,
    });
    setDebrief(debriefResult.text);
    if (debriefResult.failed) reportError(debriefResult.message || apiErrorText.debrief);
  }, [reportError]);

  const finalizeStop = useCallback(() => {
    const spokenText = liveRef.current.trim();
    const seconds = elapsed;
    setTranscript(spokenText);
    setPhase("stopped");
    const fromTalk = extractSpeechCitations(spokenText);
    setChecked(fromTalk);
    setDebrief("");

    void (async () => {
      const extracted = await requestExtract(spokenText);
      if (extracted.failed) reportError(apiErrorText.extract);
      const speech = capSpeechCitations(
        mergeCitations(fromTalk, citationsFromTexts(extracted.queries)),
      );
      await runVerify(speech, spokenText, seconds);
    })();
  }, [elapsed, reportError, runVerify]);

  useEffect(() => {
    if (phase !== "talking") return;
    const id = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "talking") return;
    hushVoxide();

    let stopListen: (() => void) | undefined;
    const wait = window.setTimeout(() => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopListen = startBrowserListen({
        lang: "en-US",
        onText: (full) => {
          const cleaned = mergeSpeech("", full);
          liveRef.current = cleaned;
          setLive(cleaned);
        },
        onError: (reason: MicFailureReason) => {
          setTranscript(liveRef.current);
          setPhase("stopped");
          reportError(micErrorText[reason]);
        },
      });
    }, 1600);

    return () => {
      window.clearTimeout(wait);
      stopListen?.();
    };
  }, [phase, reportError]);

  useEffect(() => {
    return bindVivaSession({
      start: () => {
        if (phase === "talking") {
          return { ok: false, message: "Practice is already running." };
        }
        resetSession();
        setPhase("talking");
        return { ok: true, message: "Practice started." };
      },
      stop: () => {
        if (phase !== "talking") {
          return { ok: false, message: "Practice is not running." };
        }
        finalizeStop();
        return { ok: true, message: "Practice stopped." };
      },
      snapshot: () => ({
        phase,
        elapsedSeconds: elapsed,
        canStart: phase !== "talking",
        canStop: phase === "talking",
      }),
    });
  }, [phase, elapsed, finalizeStop, resetSession]);

  const shownTranscript = phase === "talking" ? live : transcript;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-12 md:py-10">
      <header className="border-b border-rule pb-8">
        <h1 className="font-display text-6xl leading-none text-ink md:text-7xl">Viva</h1>
      </header>

      <div className="flex flex-col gap-16 pt-14 md:pt-20">
        <SessionBar
          phase={phase}
          elapsedSeconds={elapsed}
          onStart={() => {
            resetSession();
            setPhase("talking");
            hushVoxide();
          }}
          onStop={finalizeStop}
        />

        {errorText ? (
          <p role="alert" className="rounded-xl border border-rust/30 bg-rust/5 px-5 py-3 text-[15px] leading-relaxed text-rust">
            {errorText}
          </p>
        ) : null}

        <DebriefPanel transcript={shownTranscript} citations={checked ?? []} debrief={debrief} />
      </div>
    </div>
  );
}
