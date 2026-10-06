"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebriefPanel } from "@/components/booth/DebriefPanel";
import { SessionBar } from "@/components/booth/SessionBar";
import { Sidebar, type BoothView } from "@/components/booth/Sidebar";
import { HomeView } from "@/components/booth/HomeView";
import { TakesView } from "@/components/booth/TakesView";
import { ManuscriptForm } from "@/components/booth/ManuscriptForm";
import { SettingsView } from "@/components/booth/SettingsView";
import { AuthModal, type AuthUser } from "@/components/auth/AuthModal";
import { PricingModal } from "@/components/billing/PricingModal";
import { ExaminerChat } from "@/components/chat/ExaminerChat";
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
import { requestQuestions } from "@/lib/request-questions";
import { bindVivaSession } from "@/lib/session-bridge";
import { loadSettings, saveSettings } from "@/lib/settings";
import { mergeSpeech } from "@/lib/speech-clean";
import { verifyCitations } from "@/lib/verify-citations";
import { hushVoxide } from "@/lib/voxide-client";
import { listSessions, rememberSession, countStatuses, sayLine } from "@/lib/sessions";
import type { AppLanguage, Citation, Manuscript, SessionPhase } from "@/lib/types";

const micErrorText = {
  en: copyFor("en").mic,
  am: copyFor("am").mic,
};

const apiErrorText = {
  en: copyFor("en").api,
  am: copyFor("am").api,
};

const initialManuscript: Manuscript = {
  title: "",
  question: "",
  abstract: "",
  references: ["", "", "", "", ""],
};

export function Booth() {
  const [view, setView] = useState<BoothView>("home");
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState("");
  const liveRef = useRef("");
  const [transcript, setTranscript] = useState("");
  const [checked, setChecked] = useState<Citation[] | null>(null);
  const [debrief, setDebrief] = useState("");
  const [errorText, setErrorText] = useState("");
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [manuscript, setManuscript] = useState<Manuscript>(initialManuscript);

  // Authentication & Billing state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Active session and questions state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [examinerQuestions, setExaminerQuestions] = useState<string[]>([]);
  const [examinerNote, setExaminerNote] = useState<string | null>(null);

  const text = copyFor(language);

  // Fetch current user on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.ok && data.user) {
          setUser(data.user);
        }
      } catch {
        /* guest mode */
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    const settings = loadSettings();
    setLanguage(settings.language);
  }, []);

  const chooseLanguage = (next: AppLanguage) => {
    setLanguage(next);
    const current = loadSettings();
    saveSettings({ name: current.name, language: next });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      console.error("Logout failed:", e);
    }
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
    setActiveSessionId(null);
    setExaminerQuestions([]);
    setExaminerNote(null);
  }, []);

  const runVerify = useCallback(async (list: Citation[], spokenText: string, seconds: number) => {
    setChecked(list);
    setDebrief("");

    const verified = await verifyCitations(list);
    setChecked(verified.citations);
    if (verified.failed) reportError(apiErrorText[language].verify);

    // 1. Request Gemini debrief
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

    // 2. Request examiner questions
    const qResult = await requestQuestions({
      language,
      abstract: manuscript.abstract,
      transcript: spokenText,
      citations: verified.citations,
      count: 2,
    });

    const questionsList = qResult?.questions || [
      "How did you address confounding variables in your methodology?",
      "What are the primary limitations to generalizing these findings?",
    ];
    setExaminerQuestions(questionsList);
    setExaminerNote(qResult?.note || null);

    // 3. Save session to Database & LocalStorage
    const statuses = countStatuses(verified.citations);
    const title = manuscript.title.trim() || "Open Defense Talk";
    const say = sayLine(debriefResult.text);

    // Save to local storage as fallback
    const localId = `session-${Date.now()}`;
    rememberSession({
      id: localId,
      packId: "open",
      title,
      mode: manuscript.abstract ? "prepared" : "open",
      take: 1,
      at: new Date().toISOString(),
      seconds,
      transcript: spokenText,
      inCorpus: statuses.inCorpus,
      notFound: statuses.notFound,
      unverified: statuses.unverified,
      say,
      questions: questionsList,
      questionNote: qResult?.note || null,
      debrief: debriefResult.text,
      citations: verified.citations,
    });

    // Save to backend database if logged in
    try {
      const dbRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mode: manuscript.abstract ? "prepared" : "open",
          seconds,
          transcript: spokenText,
          inCorpus: statuses.inCorpus,
          notFound: statuses.notFound,
          unverified: statuses.unverified,
          say,
          debrief: debriefResult.text,
          questionNote: qResult?.note,
          questions: questionsList,
          citations: verified.citations,
        }),
      });

      const dbData = await dbRes.json();
      if (dbData.ok && dbData.session) {
        setActiveSessionId(dbData.session.id);
        // Refresh user credits
        if (user && user.plan === "free" && user.credits > 0) {
          setUser({ ...user, credits: Math.max(0, user.credits - 1) });
        }
      } else if (dbData.needsUpgrade) {
        setPricingModalOpen(true);
      } else {
        setActiveSessionId(localId);
      }
    } catch {
      setActiveSessionId(localId);
    }
  }, [language, manuscript.abstract, manuscript.title, reportError, user]);

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
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      {/* Sidebar Navigation & Account Info */}
      <Sidebar
        view={view}
        onChange={setView}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenUpgrade={() => setPricingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-8 md:px-12 md:py-10 max-w-5xl">
        {/* Top bar with language switcher */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-rule/60">
          <div className="text-xs uppercase tracking-wider text-ink/50 font-medium">
            {view === "home"
              ? "Home Overview"
              : view === "practice"
              ? "Speaking Practice Booth"
              : view === "takes"
              ? "Defense History & Q&A"
              : view === "manuscripts"
              ? "Manuscript Preparation"
              : "Account Settings"}
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="text-xs font-medium text-ink underline underline-offset-4 hover:opacity-80"
              >
                Sign in
              </button>
            ) : null}

            <select
              value={language}
              onChange={(e) => chooseLanguage(e.target.value === "am" ? "am" : "en")}
              className="rounded-full border border-rule bg-card px-3 py-1.5 text-xs text-ink outline-none"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>
          </div>
        </div>

        {/* 1. Home View */}
        {view === "home" ? (
          <HomeView
            name={user ? user.name : ""}
            sessions={listSessions()}
            onTalk={() => {
              setView("practice");
              resetSession();
              setPhase("talking");
              hushVoxide();
            }}
            onManuscript={() => setView("manuscripts")}
            onOpenTakes={() => setView("takes")}
            onResume={() => setView("practice")}
          />
        ) : null}

        {/* 2. Practice Booth View */}
        {view === "practice" ? (
          <div className="flex flex-col gap-10">
            <SessionBar
              phase={phase}
              elapsedSeconds={elapsed}
              startLabel={text.start}
              stopLabel={text.stop}
              onStart={() => {
                resetSession();
                setPhase("talking");
                hushVoxide();
              }}
              onStop={finalizeStop}
            />

            {errorText ? (
              <p
                role="alert"
                className="rounded-xl border border-rust/30 bg-rust/5 px-5 py-3 text-[15px] leading-relaxed text-rust"
              >
                {errorText}
              </p>
            ) : null}

            <DebriefPanel
              transcript={shownTranscript}
              citations={checked ?? []}
              debrief={debrief}
              language={language}
            />

            {/* Interactive Examiner Chat once practice has finished */}
            {phase === "stopped" && activeSessionId ? (
              <div className="mt-4 pt-6 border-t border-rule">
                <ExaminerChat
                  sessionId={activeSessionId}
                  sessionTitle={manuscript.title.trim() || "Open Defense Talk"}
                  initialQuestions={examinerQuestions}
                  onRequireAuth={() => setAuthModalOpen(true)}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 3. Takes & Chat History View */}
        {view === "takes" ? (
          <TakesView
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
            onOpenUpgrade={() => setPricingModalOpen(true)}
          />
        ) : null}

        {/* 4. Manuscripts View */}
        {view === "manuscripts" ? (
          <div className="flex flex-col gap-8">
            <ManuscriptForm
              value={manuscript}
              onChange={setManuscript}
              onPrepare={() => setView("practice")}
              onOpenTalk={() => setView("practice")}
              disabled={phase === "talking"}
            />
          </div>
        ) : null}

        {/* 5. Settings View */}
        {view === "settings" ? (
          <SettingsView
            name={user ? user.name : ""}
            language={language}
            onName={(val) => {
              if (user) setUser({ ...user, name: val });
            }}
            onLanguage={chooseLanguage}
          />
        ) : null}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />

      {/* Pricing / Payments Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        user={user}
        onPlanUpdated={(updatedUser) => setUser(updatedUser)}
        onRequireAuth={() => setAuthModalOpen(true)}
      />
    </div>
  );
}
