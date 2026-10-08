"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type ChatMessageItem = {
  id: string;
  role: "student" | "examiner" | string;
  content: string;
  createdAt: string;
};

type Props = {
  sessionId: string;
  sessionTitle: string;
  initialQuestions?: string[];
  initialMessages?: ChatMessageItem[];
  onRequireAuth?: () => void;
};

export function ExaminerChat({
  sessionId,
  sessionTitle,
  initialQuestions = [],
  initialMessages = [],
  onRequireAuth,
}: Props) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    if (initialMessages.length > 0) return initialMessages;
    return initialQuestions.map((q, idx) => ({
      id: `init-${idx}`,
      role: "examiner",
      content: q,
      createdAt: new Date().toISOString(),
    }));
  });

  const [inputAnswer, setInputAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Toggle browser voice input for answering viva questions
  const handleToggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    const w = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser for chat input.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError("");
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript;
        if (spoken) {
          setInputAnswer((prev) => (prev ? `${prev} ${spoken}` : spoken));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setError("Could not access microphone for chat voice input.");
    }
  };

  const handleSendAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputAnswer.trim() || sending) return;

    const answerText = inputAnswer.trim();
    setInputAnswer("");
    setError("");
    setSending(true);

    // Optimistically add student's message
    const tempStudentMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      role: "student",
      content: answerText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempStudentMsg]);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerText }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 401 && onRequireAuth) {
          onRequireAuth();
          throw new Error("Please log in to continue the mock viva examination.");
        }
        throw new Error(data.error || "Failed to submit answer to examiner.");
      }

      // Add the examiner's feedback & follow-up question
      if (data.examinerMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempStudentMsg.id),
          data.studentMessage,
          data.examinerMessage,
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error contacting examiner.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-3xl border border-rule bg-card overflow-hidden">
      <div className="border-b border-rule bg-paper/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl text-ink">Interactive Mock Viva</h3>
          <p className="text-xs text-ink/60 mt-0.5">
            Defend your thesis in real time. Answer the examiner&apos;s questions by typing or speaking.
          </p>
        </div>
        <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-medium text-moss">
          Active Defense
        </span>
      </div>

      {/* Conversation Thread */}
      <div className="flex flex-col gap-4 p-6 max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink/50 py-8">
            No questions yet. Complete a defense talk take to start the viva!
          </p>
        ) : (
          messages.map((msg, i) => {
            const isExaminer = msg.role === "examiner";
            return (
              <div
                key={msg.id || i}
                className={`flex flex-col max-w-[85%] ${
                  isExaminer ? "self-start" : "self-end items-end"
                }`}
              >
                <span className="text-[11px] font-semibold tracking-wider uppercase mb-1 px-1 text-ink/50">
                  {isExaminer ? "Examiner" : "Candidate (You)"}
                </span>
                <div
                  className={`rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed ${
                    isExaminer
                      ? "border border-rule bg-paper text-ink"
                      : "bg-ink text-paper"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}

        {sending ? (
          <div className="self-start flex items-center gap-2 rounded-2xl border border-rule bg-paper px-4 py-3 text-sm text-ink/60">
            <span className="animate-spin text-ink">⏳</span> Examiner is reviewing your answer...
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mx-6 mb-2 rounded-xl border border-rust/30 bg-rust/5 p-3 text-xs text-rust">
          {error}
        </div>
      ) : null}

      {/* Input controls */}
      <form
        onSubmit={handleSendAnswer}
        className="border-t border-rule bg-paper p-4 flex gap-2 items-center"
      >
        <button
          type="button"
          onClick={handleToggleVoiceInput}
          title={isListening ? "Listening... click to stop" : "Speak your answer"}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
            isListening
              ? "border-rust bg-rust/10 text-rust animate-pulse"
              : "border-rule bg-card text-ink/70 hover:border-ink hover:text-ink"
          }`}
        >
          🎤
        </button>

        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          placeholder={
            isListening ? "Listening to your voice..." : "Type your defense answer here..."
          }
          disabled={sending}
          className="flex-1 rounded-full border border-rule bg-card px-5 py-2.5 text-sm text-ink outline-none focus:border-ink"
        />

        <Button
          type="submit"
          disabled={!inputAnswer.trim() || sending}
          className="shrink-0"
        >
          {sending ? "Evaluating..." : "Respond"}
        </Button>
      </form>
    </div>
  );
}
