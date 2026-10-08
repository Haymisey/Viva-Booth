"use client";

import { useEffect, useRef, useState } from "react";
import { SoftScroll } from "@/components/booth/SoftScroll";
import { startBrowserListen } from "@/lib/browser-listen";
import { copyFor, quotaNotice } from "@/lib/copy";
import { talkIsReady } from "@/lib/talk-ready";
import type { PaperContext } from "@/lib/paper";
import { requestQuestions } from "@/lib/request-questions";
import { mergeSpeech } from "@/lib/speech-clean";
import { hushVoxide, releaseVoxide } from "@/lib/voxide-client";
import type { AppLanguage, Citation } from "@/lib/types";

export type ExamTurn = { role: "examiner" | "student"; content: string };

type Props = {
  language: AppLanguage;
  phaseTalking: boolean;
  stopped: boolean;
  debrief: string;
  transcript: string;
  seconds: number;
  citations: Citation[];
  paper: PaperContext;
  sessionId?: string | null;
  loadedTalkId?: string | null;
  initialTurns?: ExamTurn[];
};

export function ExaminerDoor({
  language,
  phaseTalking,
  stopped,
  debrief,
  transcript,
  seconds,
  citations,
  paper,
  sessionId,
  loadedTalkId = null,
  initialTurns = [],
}: Props) {
  const text = copyFor(language);
  const [turns, setTurns] = useState<ExamTurn[]>(initialTurns);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const stopListen = useRef<(() => void) | null>(null);

  const haltMic = () => {
    stopListen.current?.();
    stopListen.current = null;
    setListening(false);
  };

  useEffect(() => {
    setTurns(initialTurns);
    setAnswer("");
    setError("");
    haltMic();
  }, [loadedTalkId, transcript, seconds, debrief]);

  useEffect(() => () => haltMic(), []);

  if (phaseTalking || !stopped || !debrief) return null;

  const ready = talkIsReady(seconds, transcript);

  const startExam = async () => {
    releaseVoxide();
    setBusy(true);
    setError("");
    const result = await requestQuestions({
      language,
      abstract: "",
      transcript,
      seconds,
      citations,
      count: 1,
      paper,
    });
    setBusy(false);
    if (!result?.questions[0]) {
      setError(text.examFailed);
      return;
    }
    setTurns([{ role: "examiner", content: result.questions[0] }]);
  };

  const toggleSpeak = () => {
    if (busy) return;
    if (listening) {
      haltMic();
      return;
    }
    setError("");
    releaseVoxide();
    hushVoxide();
    setListening(true);
    stopListen.current = startBrowserListen({
      lang: "en-US",
      onText: (full) => setAnswer(mergeSpeech("", full)),
      onError: (reason) => {
        haltMic();
        setError(text.mic[reason]);
      },
    });
  };

  const sendAnswer = async () => {
    haltMic();
    releaseVoxide();
    const spoken = answer.trim();
    if (!spoken || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/examiner/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          seconds,
          answer: spoken,
          language,
          sessionId: sessionId || undefined,
          paper,
          history: turns,
        }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !json.text) {
        setError(json.error === quotaNotice || res.status === 429 ? text.quota : json.error || text.examFailed);
        return;
      }
      setTurns((prev) => [
        ...prev,
        { role: "student", content: spoken },
        { role: "examiner", content: json.text as string },
      ]);
      setAnswer("");
    } catch {
      setError(text.examFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="examiner-door">
      <h3 className="font-display text-2xl text-ink">{text.exam}</h3>
      <span className="mt-2 block h-px w-16 bg-ink/40" />
      {!ready ? (
        <p className="mt-5 text-[15px] leading-relaxed text-ink/65">{text.examTooShort}</p>
      ) : turns.length === 0 ? (
        <div className="mt-5 flex flex-col items-start gap-4">
          <p className="mt-0 text-[15px] leading-relaxed text-ink/65">{text.examHint}</p>
          <button type="button" className="paper-strip-btn solid" disabled={busy} onClick={() => void startExam()}>
            {busy ? text.examAsking : text.examAsk}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          <SoftScroll className="exam-thread">
            {turns.map((turn, index) => (
              <div key={`${turn.role}-${index}`} className={turn.role === "examiner" ? "exam-turn exam-q" : "exam-turn exam-a"}>
                {turn.role === "student" ? <p className="exam-role">{text.examYou}</p> : null}
                <p className="whitespace-pre-wrap">{turn.content}</p>
              </div>
            ))}
          </SoftScroll>
          <textarea
            className="paper-strip-field paper-strip-excerpt"
            rows={3}
            value={answer}
            disabled={busy}
            placeholder={listening ? text.examListening : text.examAnswer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <div className="exam-actions">
            <button type="button" className="paper-strip-btn" disabled={busy} onClick={toggleSpeak}>
              {listening ? text.examStopSpeak : text.examSpeak}
            </button>
            <button
              type="button"
              className="paper-strip-btn solid"
              disabled={busy || !answer.trim()}
              onClick={() => void sendAnswer()}
            >
              {busy ? text.examWaiting : text.examSend}
            </button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="paper-strip-error mt-3">
          {error}
        </p>
      ) : null}
    </section>
  );
}
