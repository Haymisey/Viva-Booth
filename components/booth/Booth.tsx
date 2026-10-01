"use client";

import { useCallback, useEffect, useState } from "react";
import { DebriefPanel } from "@/components/booth/DebriefPanel";
import { ExaminerPackCard } from "@/components/booth/ExaminerPackCard";
import { ExaminerQuestions } from "@/components/booth/ExaminerQuestions";
import { ManuscriptForm } from "@/components/booth/ManuscriptForm";
import { PackLibrary } from "@/components/booth/PackLibrary";
import { SessionBar } from "@/components/booth/SessionBar";
import { startBrowserListen, type MicFailureReason } from "@/lib/browser-listen";
import {
  capSpeechCitations,
  citationsFromTexts,
  extractSpeechCitations,
  mergeCitations,
} from "@/lib/extract-citations";
import { listPacks, rememberPack } from "@/lib/library";
import { emptyCitations, emptyManuscript } from "@/lib/mock";
import { buildPack, loadPack, savePack } from "@/lib/pack";
import { requestDebrief } from "@/lib/request-debrief";
import { requestExtract } from "@/lib/request-extract";
import { requestQuestions } from "@/lib/request-questions";
import { bindVivaSession } from "@/lib/session-bridge";
import { mergeSpeech } from "@/lib/speech-clean";
import { verifyCitations } from "@/lib/verify-citations";
import { hushVoxide } from "@/lib/voxide-client";
import type {
  AppLanguage,
  Citation,
  ExaminerPack,
  Manuscript,
  SessionMode,
  SessionPhase,
} from "@/lib/types";

const recognitionLang: Record<AppLanguage, string> = {
  en: "en-US",
  am: "am-ET",
};

const labels: Record<AppLanguage, string> = {
  en: "English",
  am: "አማርኛ",
};

const micErrorText: Record<AppLanguage, Record<MicFailureReason, string>> = {
  en: {
    unsupported: "Microphone speech recognition is not supported in this browser.",
    permission_denied: "Microphone access was denied. Allow microphone permission and try again.",
    unavailable: "No working microphone was found. Connect a microphone and retry.",
    network: "Microphone transcription lost connection. Check your network and retry.",
    start_failed: "Microphone could not start. Check your microphone setup and try again.",
    unknown: "Microphone failed while listening. Please try again.",
  },
  am: {
    unsupported: "በዚህ ብራውዘር የማይክሮፎን ንግግር መለየት አይደገፍም።",
    permission_denied: "የማይክሮፎን ፍቃድ ተከልክሏል። ፍቃድ ሰጥተህ እንደገና ሞክር።",
    unavailable: "የሚሰራ ማይክሮፎን አልተገኘም። ማይክሮፎን አገናኝ እና ድገም።",
    network: "የማይክሮፎን ጽሑፍ አገልግሎት ኔትወርክ ጠፍቷል። ኔትወርክህን አረጋግጥ እና ድገም።",
    start_failed: "ማይክሮፎን መጀመር አልተቻለም። ቅንብሮችን አረጋግጥ እና ድገም።",
    unknown: "ሲያዳምጥ የማይክሮፎን ችግኝ ተፈጥሯል። እባክህ ድገም።",
  },
};

const apiErrorText: Record<AppLanguage, Record<"extract" | "verify" | "debrief", string>> = {
  en: {
    extract: "Citation extraction service failed. Results may be incomplete.",
    verify: "Citation verification service failed. Marked as unverified.",
    debrief: "Debrief service failed. Try again after the network recovers.",
  },
  am: {
    extract: "የማጣቀሻ ማውጫ አገልግሎት አልሰራም። ውጤቱ ያልተሟላ ሊሆን ይችላል።",
    verify: "የማጣቀሻ ማረጋገጫ አገልግሎት አልሰራም። ሁሉም እንደ unverified ተመዝግቧል።",
    debrief: "የdebrief አገልግሎት አልሰራም። ኔትወርክ ከተመለሰ በኋላ ድገም።",
  },
};

function manuscriptFromPack(pack: ExaminerPack): Manuscript {
  const references: Manuscript["references"] = ["", "", "", "", ""];
  pack.citations.forEach((c, i) => {
    if (i < 5) references[i] = c.text;
  });
  return {
    title: pack.title,
    question: pack.question,
    abstract: pack.abstract,
    references,
  };
}

function withId(pack: ExaminerPack): ExaminerPack {
  if (pack.id) return pack;
  return { ...pack, id: crypto.randomUUID() };
}

export function Booth() {
  const [manuscript, setManuscript] = useState<Manuscript>(emptyManuscript);
  const [pack, setPack] = useState<ExaminerPack | null>(null);
  const [library, setLibrary] = useState<ExaminerPack[]>([]);
  const [formOpen, setFormOpen] = useState(true);
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState("");
  const [transcript, setTranscript] = useState("");
  const [spoken, setSpoken] = useState<Citation[]>([]);
  const [checked, setChecked] = useState<Citation[] | null>(null);
  const [debrief, setDebrief] = useState("");
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [errorText, setErrorText] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [take, setTake] = useState<1 | 2>(1);
  const [questions, setQuestions] = useState<[string, string] | null>(null);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    if (typeof SpeechSynthesisUtterance === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = recognitionLang[language];
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      /* keep visual error only */
    }
  }, [language]);

  const speakQuestions = useCallback((pair: [string, string]) => {
    if (typeof window === "undefined") return;
    if (typeof SpeechSynthesisUtterance === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      for (const text of pair) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = recognitionLang[language];
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      /* visual questions still show */
    }
  }, [language]);

  const reportError = useCallback((text: string) => {
    setErrorText(text);
    speak(text);
  }, [speak]);

  const reportMicError = useCallback((reason: MicFailureReason) => {
    reportError(micErrorText[language][reason]);
  }, [language, reportError]);

  const reportApiError = useCallback((kind: "extract" | "verify" | "debrief") => {
    reportError(apiErrorText[language][kind]);
  }, [language, reportError]);

  const resetSession = useCallback(() => {
    setLive("");
    setTranscript("");
    setSpoken([]);
    setChecked(null);
    setDebrief("");
    setElapsed(0);
    setErrorText("");
  }, []);

  const runVerify = useCallback(async (list: Citation[], spokenText: string, abstract: string) => {
    setChecked(list);
    setDebrief("");

    const verified = await verifyCitations(list);
    setChecked(verified.citations);
    if (verified.failed) reportApiError("verify");

    const debriefResult = await requestDebrief({
      transcript: spokenText,
      abstract,
      citations: verified.citations,
      language,
    });
    setDebrief(debriefResult.text);
    if (debriefResult.failed) reportApiError("debrief");
    return verified.citations;
  }, [language, reportApiError]);

  const finalizeStop = useCallback(() => {
    const spokenText = live.trim();
    const fromTalk = extractSpeechCitations(spokenText);
    setTranscript(spokenText);
    setSpoken(fromTalk);
    setPhase("stopped");

    const fromPack = pack && pack.mode === "prepared" ? pack.citations : emptyCitations;
    const abstract = pack?.abstract ?? "";
    setChecked(mergeCitations(fromPack, fromTalk));
    setDebrief("");

    void (async () => {
      const extracted = await requestExtract(spokenText);
      if (extracted.failed) reportApiError("extract");

      const extra = citationsFromTexts(extracted.queries);
      const speech = capSpeechCitations(mergeCitations(fromTalk, extra));
      setSpoken(speech);

      const checkedList = await runVerify(mergeCitations(fromPack, speech), spokenText, abstract);
      if (take === 1) {
        const pair = await requestQuestions({
          language,
          abstract,
          citations: checkedList,
        });
        if (pair) {
          setQuestions(pair);
          speakQuestions(pair);
        }
      }
    })();
  }, [live, pack, reportApiError, runVerify, take, language, speakQuestions]);

  useEffect(() => {
    const stored = loadPack();
    if (stored) {
      const current = withId(stored);
      setPack(current);
      setManuscript(manuscriptFromPack(current));
      setPhase("prepared");
      setFormOpen(false);
    }
    setLibrary(listPacks());
    setHydrated(true);
  }, []);

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
      stopListen = startBrowserListen({
        lang: recognitionLang[language],
        onFinal: (chunk) => {
          setLive((cur) => mergeSpeech(cur, chunk));
        },
        onError: (reason) => {
          setPhase("stopped");
          reportMicError(reason);
        },
      });
    }, 1600);

    return () => {
      window.clearTimeout(wait);
      stopListen?.();
    };
  }, [phase, language, reportMicError]);

  useEffect(() => {
    return bindVivaSession({
      start: () => {
        if (phase !== "prepared" && phase !== "stopped") {
          return {
            ok: false,
            message: "Prepare a manuscript or begin open talk first.",
          };
        }
        resetSession();
        if (phase === "stopped") setTake(2);
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
        canStart: phase === "prepared" || phase === "stopped",
        canStop: phase === "talking",
      }),
    });
  }, [phase, elapsed, live, language, finalizeStop, resetSession]);

  const lockPack = (mode: SessionMode) => {
    const next = buildPack(manuscript, mode);
    setPack(next);
    savePack(next);
    rememberPack(next);
    setLibrary(listPacks());
    setPhase("prepared");
    setFormOpen(false);
    setTake(1);
    setQuestions(null);
    resetSession();
    if (mode === "prepared") {
      void runVerify(next.citations, "", next.abstract);
    }
  };

  const applyPack = (next: ExaminerPack) => {
    const current = withId(next);
    setPack(current);
    setManuscript(manuscriptFromPack(current));
    savePack(current);
    setPhase("prepared");
    setFormOpen(false);
    setTake(1);
    setQuestions(null);
    resetSession();
    if (current.mode === "prepared") {
      void runVerify(current.citations, "", current.abstract);
    }
  };

  const formLocked = phase === "talking";
  const showForm = !hydrated || formOpen || !pack;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10 md:px-10 md:py-14">
      <header className="flex items-baseline justify-between gap-6">
        <h1 className="font-display text-5xl text-ink md:text-6xl">Viva</h1>
        <p className="max-w-[13rem] text-right text-xs leading-relaxed text-ink/45">
          Read first. Then listen. Never invent a paper.
        </p>
      </header>

      <div className="flex items-center justify-end gap-2 text-sm text-ink/60">
        <label htmlFor="language" className="text-[11px] uppercase tracking-[0.14em] text-ink/45">
          Language
        </label>
        <select
          id="language"
          value={language}
          disabled={phase === "talking"}
          onChange={(event) => setLanguage(event.target.value === "am" ? "am" : "en")}
          className="rounded-full border border-rule bg-paper px-3 py-1.5 text-xs tracking-wide text-ink outline-none disabled:opacity-50"
        >
          <option value="en">{labels.en}</option>
          <option value="am">{labels.am}</option>
        </select>
      </div>

      {hydrated ? (
        <PackLibrary packs={library} activeId={pack?.id ?? null} onSelect={applyPack} />
      ) : null}

      {showForm ? (
        <ManuscriptForm
          value={manuscript}
          onChange={setManuscript}
          disabled={formLocked}
          onPrepare={() => lockPack("prepared")}
          onOpenTalk={() => lockPack("open")}
        />
      ) : pack ? (
        <ExaminerPackCard pack={pack} onEdit={() => setFormOpen(true)} />
      ) : null}

      <SessionBar
        phase={phase}
        elapsedSeconds={elapsed}
        onStart={() => {
          if (phase === "stopped") setTake(2);
          resetSession();
          setPhase("talking");
          hushVoxide();
        }}
        onStop={finalizeStop}
      />

      <ExaminerQuestions questions={questions} />

      {errorText ? (
        <p role="alert" className="-mt-6 border-t border-rule pt-4 text-sm leading-relaxed text-rust">
          {errorText}
        </p>
      ) : null}

      <DebriefPanel
        transcript={phase === "talking" ? live : transcript}
        citations={
          checked ??
          mergeCitations(
            pack && pack.mode === "prepared" ? pack.citations : emptyCitations,
            spoken,
          )
        }
        debrief={debrief}
      />
    </div>
  );
}
