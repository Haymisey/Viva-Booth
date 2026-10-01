"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebriefPanel } from "@/components/booth/DebriefPanel";
import { ExaminerQuestions } from "@/components/booth/ExaminerQuestions";
import { HomeView } from "@/components/booth/HomeView";
import { ManuscriptForm } from "@/components/booth/ManuscriptForm";
import { PackLibrary } from "@/components/booth/PackLibrary";
import { RecentTakes } from "@/components/booth/RecentTakes";
import { SessionBar } from "@/components/booth/SessionBar";
import { SettingsView } from "@/components/booth/SettingsView";
import { Sidebar, type BoothView } from "@/components/booth/Sidebar";
import { startBrowserListen, type MicFailureReason } from "@/lib/browser-listen";
import {
  capSpeechCitations,
  citationsFromTexts,
  extractSpeechCitations,
  mergeCitations,
} from "@/lib/extract-citations";
import { listPacks, packLabel, rememberPack } from "@/lib/library";
import {
  clearSessions,
  countStatuses,
  listSessions,
  rememberSession,
  sayLine,
  type SessionRecord,
} from "@/lib/sessions";
import { emptyCitations, emptyManuscript } from "@/lib/mock";
import { buildPack, loadPack, savePack } from "@/lib/pack";
import { requestDebrief } from "@/lib/request-debrief";
import { requestExtract } from "@/lib/request-extract";
import { requestQuestions } from "@/lib/request-questions";
import { requestTitle } from "@/lib/request-title";
import { bindVivaSession } from "@/lib/session-bridge";
import { mergeSpeech } from "@/lib/speech-clean";
import { verifyCitations } from "@/lib/verify-citations";
import { loadSettings, saveSettings } from "@/lib/settings";
import { hushVoxide } from "@/lib/voxide-client";
import type { Verdict } from "@/lib/gemini";
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
  const liveRef = useRef("");
  const [transcript, setTranscript] = useState("");
  const [spoken, setSpoken] = useState<Citation[]>([]);
  const [checked, setChecked] = useState<Citation[] | null>(null);
  const [debrief, setDebrief] = useState("");
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [name, setName] = useState("");
  const [errorText, setErrorText] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<BoothView>("home");
  const [take, setTake] = useState(1);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [questionNote, setQuestionNote] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");

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

  const speakQuestions = useCallback((note: string | null, lines: string[]) => {
    if (typeof window === "undefined") return;
    if (typeof SpeechSynthesisUtterance === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      for (const text of [note, ...lines]) {
        if (!text) continue;
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
    liveRef.current = "";
    setLive("");
    setTranscript("");
    setSpoken([]);
    setChecked(null);
    setDebrief("");
    setVerdicts([]);
    setElapsed(0);
    setErrorText("");
  }, []);

  const runVerify = useCallback(async (
    list: Citation[],
    spokenText: string,
    abstract: string,
    asked: string[] = [],
    wantFollowUps = false,
  ) => {
    setChecked(list);
    setDebrief("");
    setVerdicts([]);

    const verified = await verifyCitations(list);
    setChecked(verified.citations);
    if (verified.failed) reportApiError("verify");

    const debriefResult = await requestDebrief({
      transcript: spokenText,
      abstract,
      citations: verified.citations,
      language,
      questions: asked,
      followUps: wantFollowUps,
    });
    setDebrief(debriefResult.text);
    setVerdicts(debriefResult.verdicts);
    if (debriefResult.failed) reportApiError("debrief");
    return {
      citations: verified.citations,
      debrief: debriefResult.text,
      followUps: debriefResult.followUps,
      verdicts: debriefResult.verdicts,
    };
  }, [language, reportApiError]);

  const finalizeStop = useCallback(() => {
    const spokenText = live.trim();
    const seconds = elapsed;
    const currentTake = take;
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

      const judging = currentTake > 1 && (questions?.length ?? 0) > 0;
      const result = await runVerify(
        mergeCitations(fromPack, speech),
        spokenText,
        abstract,
        judging ? questions ?? [] : [],
        currentTake === 2,
      );
      let asked = questions;
      let note = currentTake === 1 ? null : questionNote;
      if (currentTake === 1) {
        const turn = await requestQuestions({
          language,
          abstract,
          transcript: spokenText,
          citations: result.citations,
          count: 4,
        });
        if (turn) {
          asked = turn.questions;
          note = turn.note;
          setQuestionNote(turn.note);
          setQuestions(turn.questions);
          speakQuestions(turn.note, turn.questions);
        }
      } else if (currentTake === 2 && result.followUps.length > 0) {
        asked = result.followUps;
        setQuestions(result.followUps);
        speakQuestions(null, result.followUps);
      }

      if (pack && (spokenText || seconds > 0)) {
        let title = sessionTitle || packLabel(pack);
        if (currentTake === 1 && pack.mode === "open") {
          const named = await requestTitle(spokenText);
          if (named) {
            title = named;
            setSessionTitle(named);
          }
        }
        const id = sessionId ?? crypto.randomUUID();
        if (!sessionId) setSessionId(id);
        rememberSession({
          id,
          packId: pack.id,
          title,
          mode: pack.mode,
          take: currentTake,
          at: new Date().toISOString(),
          seconds,
          transcript: spokenText,
          ...countStatuses(result.citations),
          say: sayLine(result.debrief),
          questions: asked,
          questionNote: note,
          debrief: result.debrief,
          verdicts: result.verdicts,
          citations: result.citations.map((c) => ({
            text: c.text,
            status: c.status,
            source: c.source,
            hitTitle: c.hitTitle,
            closestTitle: c.closestTitle,
          })),
        });
        setSessions(listSessions());
      }
    })();
  }, [live, elapsed, take, pack, questions, questionNote, sessionId, sessionTitle, reportApiError, runVerify, language, speakQuestions]);

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
    setSessions(listSessions());
    const settings = loadSettings();
    setName(settings.name);
    setLanguage(settings.language);
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
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopListen = startBrowserListen({
        lang: recognitionLang[language],
        onText: (full) => {
          const cleaned = mergeSpeech("", full);
          liveRef.current = cleaned;
          setLive(cleaned);
        },
        onError: (reason) => {
          setTranscript(liveRef.current);
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
        if (phase === "stopped") setTake((n) => n + 1);
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
    setQuestionNote(null);
    setVerdicts([]);
    setSessionId(null);
    setSessionTitle("");
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
    setQuestionNote(null);
    setVerdicts([]);
    setSessionId(null);
    setSessionTitle("");
    resetSession();
    if (current.mode === "prepared") {
      void runVerify(current.citations, "", current.abstract);
    }
  };

  const formLocked = phase === "talking";
  const showForm = !hydrated || formOpen || !pack;
  const shownTranscript = phase === "talking" ? live : transcript;
  const shownCitations =
    checked ??
    mergeCitations(pack && pack.mode === "prepared" ? pack.citations : emptyCitations, spoken);

  const beginTalk = () => {
    lockPack("open");
    setPhase("talking");
    setView("practice");
    hushVoxide();
  };

  const resume = (record: SessionRecord) => {
    const found = library.find((item) => item.id === record.packId);
    if (found) {
      setPack(found);
      setManuscript(manuscriptFromPack(found));
      savePack(found);
    }
    setFormOpen(false);
    setSessionId(record.id);
    setSessionTitle(record.title);
    liveRef.current = record.transcript;
    setLive(record.transcript);
    setTranscript(record.transcript);
    setSpoken([]);
    setQuestions(record.questions);
    setQuestionNote(record.questionNote ?? null);
    setVerdicts(record.verdicts ?? []);
    setDebrief(record.debrief ?? (record.say ? `Say: ${record.say}` : ""));
    setTake(record.take);
    setElapsed(0);
    setErrorText("");
    setChecked(
      (record.citations ?? []).map((c, i) => ({
        id: `${record.id}-${i}`,
        text: c.text,
        status: c.status,
        source: c.source,
        hitTitle: c.hitTitle,
        closestTitle: c.closestTitle,
      })),
    );
    setPhase("stopped");
    setView("practice");
  };

  const endSession = () => {
    setSessionId(null);
    setSessionTitle("");
    setQuestions(null);
    setQuestionNote(null);
    setVerdicts([]);
    setDebrief("");
    setTranscript("");
    liveRef.current = "";
    setLive("");
    setSpoken([]);
    setChecked(null);
    setTake(1);
    setElapsed(0);
    setErrorText("");
    setPhase(pack ? "prepared" : "idle");
    setView("home");
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar view={view} onChange={setView} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-8 md:px-10 md:py-12">
        {view === "home" ? (
          <HomeView
            name={name}
            sessions={sessions}
            onTalk={beginTalk}
            onManuscript={() => {
              setFormOpen(true);
              setView("practice");
            }}
            onOpenTakes={() => setView("takes")}
            onResume={resume}
          />
        ) : null}

        {view === "manuscripts" ? (
          <section className="flex flex-col gap-6">
            <h2 className="font-display text-4xl text-ink">Manuscripts</h2>
            {library.length === 0 ? (
              <p className="text-[15px] text-ink/60">Prepare one in Practice.</p>
            ) : (
              <PackLibrary
                packs={library}
                activeId={pack?.id ?? null}
                onSelect={(next) => {
                  applyPack(next);
                  setView("practice");
                }}
              />
            )}
          </section>
        ) : null}

        {view === "takes" ? (
          <RecentTakes
            sessions={sessions}
            onOpen={resume}
            onClear={() => {
              clearSessions();
              setSessions([]);
            }}
          />
        ) : null}

        {view === "settings" ? (
          <SettingsView
            name={name}
            language={language}
            onName={(next) => {
              setName(next);
              saveSettings({ name: next, language });
            }}
            onLanguage={(next) => {
              setLanguage(next);
              saveSettings({ name, language: next });
            }}
          />
        ) : null}

        {view === "practice" ? (
          <>
            {showForm ? (
              <ManuscriptForm
                value={manuscript}
                onChange={setManuscript}
                disabled={formLocked}
                onPrepare={() => lockPack("prepared")}
                onOpenTalk={() => lockPack("open")}
              />
            ) : pack ? (
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display truncate text-3xl text-ink">
                  {sessionTitle || packLabel(pack)}
                </h2>
                <div className="flex shrink-0 gap-4">
                  <button
                    type="button"
                    disabled={phase === "talking"}
                    onClick={() => setFormOpen(true)}
                    className="text-sm text-ink/60 hover:text-ink disabled:opacity-40"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={phase === "talking"}
                    onClick={endSession}
                    className="text-sm text-ink/60 hover:text-ink disabled:opacity-40"
                  >
                    End session
                  </button>
                </div>
              </div>
            ) : null}

            <SessionBar
              phase={phase}
              elapsedSeconds={elapsed}
              take={take}
              onStart={() => {
                if (phase === "stopped") setTake((n) => n + 1);
                else if (!pack) lockPack("open");
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

            <ExaminerQuestions note={questionNote} questions={questions} />

            <DebriefPanel
              transcript={shownTranscript}
              citations={shownCitations}
              debrief={debrief}
              verdicts={verdicts}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
