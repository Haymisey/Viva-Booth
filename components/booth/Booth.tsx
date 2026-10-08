"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DebriefPanel } from "@/components/booth/DebriefPanel";
import { SessionBar } from "@/components/booth/SessionBar";
import { startBrowserListen, type MicFailureReason } from "@/lib/browser-listen";
import {
  capSpeechCitations,
  citationsFromTexts,
  extractSpeechCitations,
  mergeCitations,
} from "@/lib/extract-citations";
import { copyFor, quotaNotice } from "@/lib/copy";
import { requestDebrief } from "@/lib/request-debrief";
import { requestExtract } from "@/lib/request-extract";
import { bindVivaSession } from "@/lib/session-bridge";
import { loadSettings, saveSettings } from "@/lib/settings";
import { mergeSpeech } from "@/lib/speech-clean";
import { verifyCitations } from "@/lib/verify-citations";
import { hushVoxide } from "@/lib/voxide-client";
import { Wordmark } from "@/components/viva/Wordmark";
import { countStatuses, sayLine, titleFromTranscript } from "@/lib/sessions";
import type { AppLanguage, Citation, SessionPhase } from "@/lib/types";

export type LoadedTalk = {
  id: string;
  transcript: string;
  seconds: number;
  debrief: string;
  citations: Citation[];
};

type BoothProps = {
  signedIn?: boolean;
  loadedTalk?: LoadedTalk | null;
  keepTalksLink?: ReactNode;
  onNewPractice?: () => void;
  onTalkSaved?: (id: string) => void;
};

const micErrorText = {
  en: copyFor("en").mic,
  am: copyFor("am").mic,
};

const apiErrorText = {
  en: copyFor("en").api,
  am: copyFor("am").api,
};

export function Booth({
  signedIn = false,
  loadedTalk = null,
  keepTalksLink = null,
  onNewPractice,
  onTalkSaved,
}: BoothProps) {
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState("");
  const liveRef = useRef("");
  const [transcript, setTranscript] = useState("");
  const [checked, setChecked] = useState<Citation[] | null>(null);
  const [debrief, setDebrief] = useState("");
  const [errorText, setErrorText] = useState("");
  const [language, setLanguage] = useState<AppLanguage>("en");
  const text = copyFor(language);

  useEffect(() => {
    const settings = loadSettings();
    setLanguage(settings.language);
  }, []);

  useEffect(() => {
    if (!loadedTalk) return;
    liveRef.current = loadedTalk.transcript;
    setLive("");
    setTranscript(loadedTalk.transcript);
    setChecked(loadedTalk.citations);
    setDebrief(loadedTalk.debrief);
    setElapsed(loadedTalk.seconds);
    setErrorText("");
    setPhase("stopped");
  }, [loadedTalk?.id]);

  const chooseLanguage = (next: AppLanguage) => {
    setLanguage(next);
    const current = loadSettings();
    saveSettings({ name: current.name, language: next });
  };

  const reportError = useCallback((message: string) => {
    setErrorText(message);
    if (typeof window === "undefined") return;
    if (typeof SpeechSynthesisUtterance === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = language === "am" ? "am-ET" : "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      /* keep the written error */
    }
  }, [language]);

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
    if (verified.failed) reportError(apiErrorText[language].verify);

    const debriefResult = await requestDebrief({
      transcript: spokenText,
      citations: verified.citations,
      seconds,
      language,
    });
    setDebrief(debriefResult.text);
    if (debriefResult.failed) {
      const notice = debriefResult.message === quotaNotice ? copyFor(language).quota : debriefResult.message;
      reportError(notice || apiErrorText[language].debrief);
    }

    if (signedIn && spokenText) {
      const counts = countStatuses(verified.citations);
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleFromTranscript(spokenText),
            mode: "open",
            seconds,
            transcript: spokenText,
            inCorpus: counts.inCorpus,
            notFound: counts.notFound,
            unverified: counts.unverified,
            say: sayLine(debriefResult.text),
            debrief: debriefResult.text,
            citations: verified.citations,
          }),
        });
        const json = await res.json();
        if (json.ok && json.session?.id) onTalkSaved?.(json.session.id);
      } catch {
        /* keep the debrief even if history fails */
      }
    }
  }, [language, onTalkSaved, reportError, signedIn]);

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
      if (extracted.failed) reportError(apiErrorText[language].extract);
      const speech = capSpeechCitations(
        mergeCitations(fromTalk, citationsFromTexts(extracted.queries)),
      );
      await runVerify(speech, spokenText, seconds);
    })();
  }, [elapsed, language, reportError, runVerify]);

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
          reportError(micErrorText[language][reason]);
        },
      });
    }, 1600);

    return () => {
      window.clearTimeout(wait);
      stopListen?.();
    };
  }, [phase, language, reportError]);

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
      <header className="flex items-end justify-between gap-6 border-b border-rule pb-8">
        <h1 className="leading-none">
          <Wordmark className="wordmark" />
        </h1>
        <div className="mb-2 flex shrink-0 items-center gap-4">
          {keepTalksLink}
          <label>
            <span className="sr-only">{language === "am" ? "ቋንቋ" : "Language"}</span>
            <select
              value={language}
              onChange={(event) => chooseLanguage(event.target.value === "am" ? "am" : "en")}
              className="rounded-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>
          </label>
        </div>
      </header>

      <div className="flex flex-col gap-16 pt-14 md:pt-20">
        <SessionBar
          phase={phase}
          elapsedSeconds={elapsed}
          startLabel={text.start}
          stopLabel={text.stop}
          onStart={() => {
            onNewPractice?.();
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

        <DebriefPanel transcript={shownTranscript} citations={checked ?? []} debrief={debrief} language={language} />
      </div>
    </div>
  );
}
