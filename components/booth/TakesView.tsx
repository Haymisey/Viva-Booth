"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTime } from "@/components/booth/SessionBar";
import { ExaminerChat, type ChatMessageItem } from "@/components/chat/ExaminerChat";
import type { AuthUser } from "@/components/auth/AuthModal";
import { listSessions, type SessionRecord } from "@/lib/sessions";

type Props = {
  user: AuthUser | null;
  onRequireAuth: () => void;
  onOpenUpgrade: () => void;
};

type DbSession = {
  id: string;
  title: string;
  mode: string;
  take: number;
  seconds: number;
  transcript: string;
  inCorpus: number;
  notFound: number;
  unverified: number;
  say: string | null;
  debrief: string | null;
  questionNote: string | null;
  citationsJson: string | null;
  createdAt: string;
  _count?: { messages: number };
  messages?: ChatMessageItem[];
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function TakesView({ user, onRequireAuth, onOpenUpgrade }: Props) {
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<DbSession | null>(null);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);

  const fetchDbSessions = useCallback(async () => {
    setLoading(true);
    if (!user) {
      // Fallback to local storage for guests
      const local = listSessions();
      setSessions(
        local.map((l) => ({
          id: l.id,
          title: l.title,
          mode: l.mode,
          take: l.take,
          seconds: l.seconds,
          transcript: l.transcript,
          inCorpus: l.inCorpus,
          notFound: l.notFound,
          unverified: l.unverified,
          say: l.say,
          debrief: l.debrief || null,
          questionNote: l.questionNote || null,
          citationsJson: l.citations ? JSON.stringify(l.citations) : null,
          createdAt: l.at,
          _count: { messages: l.questions ? l.questions.length : 0 },
        }))
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (data.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDbSessions();
  }, [fetchDbSessions]);

  const handleOpenDetail = async (session: DbSession) => {
    if (activeSession?.id === session.id) {
      setActiveSession(null);
      return;
    }

    if (!user) {
      setActiveSession(session);
      return;
    }

    setSessionDetailLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`);
      const data = await res.json();
      if (data.ok && data.session) {
        setActiveSession(data.session);
      } else {
        setActiveSession(session);
      }
    } catch {
      setActiveSession(session);
    } finally {
      setSessionDetailLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this defense session?")) return;

    if (user) {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-ink">Defense Takes & Chat History</h2>
          <p className="mt-1 text-sm text-ink/60">
            {user
              ? `Connected to account (${user.email}). Synced across devices.`
              : "Guest mode (saved in this browser). Sign in to sync and protect your history."}
          </p>
        </div>

        {!user ? (
          <button
            type="button"
            onClick={onRequireAuth}
            className="rounded-full border border-ink/30 px-4 py-1.5 text-xs font-medium text-ink hover:border-ink hover:bg-ink/5"
          >
            Sign in to save permanently
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper hover:bg-ink/85"
          >
            {user.plan === "pro" ? "Pro Member" : "Upgrade to Pro"}
          </button>
        )}
      </header>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink/50">Loading defense history...</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-rule bg-card p-12 text-center">
          <p className="font-display text-2xl text-ink">No takes recorded yet</p>
          <p className="mt-2 text-sm text-ink/60 max-w-sm mx-auto">
            Complete a speaking take in the Practice booth to evaluate citations and practice with the examiner AI.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((s) => {
            const isExpanded = activeSession?.id === s.id;
            return (
              <div
                key={s.id}
                className={`overflow-hidden rounded-2xl border transition ${
                  isExpanded ? "border-ink bg-card shadow-sm" : "border-rule bg-card hover:border-ink/40"
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => handleOpenDetail(s)}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display truncate text-xl text-ink">{s.title}</h3>
                      <span className="shrink-0 rounded-full border border-rule px-2.5 py-0.5 text-xs font-mono text-ink/70">
                        Take {s.take}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink/55">
                      {[formatDate(s.createdAt), `${formatTime(s.seconds)} spoke`].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-medium text-moss">
                      {s.inCorpus} cited
                    </span>
                    {s.notFound > 0 ? (
                      <span className="rounded-full bg-rust/5 px-2.5 py-0.5 text-xs font-medium text-rust">
                        {s.notFound} missing
                      </span>
                    ) : null}

                    {s._count?.messages ? (
                      <span className="rounded-full border border-ink/20 px-2.5 py-0.5 text-xs text-ink/70">
                        💬 {s._count.messages} chat turns
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      title="Delete take"
                      className="rounded-full p-2 text-ink/30 hover:bg-rust/10 hover:text-rust transition"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Interactive Mock Viva */}
                {isExpanded ? (
                  <div className="border-t border-rule bg-paper/40 p-6 flex flex-col gap-6">
                    {sessionDetailLoading ? (
                      <div className="py-6 text-center text-sm text-ink/50">Loading chat history...</div>
                    ) : (
                      <>
                        {/* Spoken Transcript */}
                        {s.transcript ? (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                              Spoken Presentation Transcript
                            </span>
                            <p className="mt-1.5 rounded-xl border border-rule bg-paper p-4 text-[15px] leading-relaxed text-ink/80">
                              {s.transcript}
                            </p>
                          </div>
                        ) : null}

                        {/* Debrief / Coaching */}
                        {s.say || s.debrief ? (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                              Coach Feedback & Phrasing
                            </span>
                            <div className="mt-1.5 rounded-xl border border-rule bg-paper p-4 text-sm text-ink/80 space-y-2">
                              {s.say ? (
                                <p className="font-display text-base italic text-ink">“{s.say}”</p>
                              ) : null}
                              {s.debrief ? (
                                <p className="whitespace-pre-wrap text-ink/70">{s.debrief}</p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {/* Interactive Examiner Chat Conversation */}
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2 block">
                            Live Examiner Chat History
                          </span>
                          <ExaminerChat
                            sessionId={s.id}
                            sessionTitle={s.title}
                            initialMessages={activeSession?.messages || []}
                            onRequireAuth={onRequireAuth}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
