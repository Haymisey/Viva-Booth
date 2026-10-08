import type { Citation, CitationStatus, SessionMode } from "./types";
import type { Verdict } from "./gemini";

export type SavedCitation = {
  text: string;
  status: CitationStatus;
  source: Citation["source"];
  hitTitle?: string;
  closestTitle?: string;
};

export type SessionRecord = {
  id: string;
  packId: string;
  title: string;
  mode: SessionMode;
  take: number;
  at: string;
  seconds: number;
  transcript: string;
  inCorpus: number;
  notFound: number;
  unverified: number;
  say: string;
  questions: string[] | null;
  questionNote?: string | null;
  debrief?: string;
  verdicts?: Verdict[];
  citations?: SavedCitation[];
};

const KEY = "viva.sessions";
const MAX = 12;

function read(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

function write(list: SessionRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function listSessions(): SessionRecord[] {
  return read();
}

export function rememberSession(record: SessionRecord) {
  write([record, ...read().filter((r) => r.id !== record.id)]);
}

export function clearSessions() {
  write([]);
}

export function titleFromTranscript(text: string) {
  const words = text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean).slice(0, 8);
  if (words.length === 0) return "Untitled practice";
  const title = words.join(" ");
  return title.length > 52 ? `${title.slice(0, 49)}…` : title;
}

export function sayLine(debrief: string) {
  return debrief.match(/^Say:\s*(.+)$/m)?.[1]?.trim() ?? "";
}

export function countStatuses(citations: Citation[]) {
  return {
    inCorpus: citations.filter((c) => c.status === "in_corpus").length,
    notFound: citations.filter((c) => c.status === "not_found").length,
    unverified: citations.filter((c) => c.status === "unverified").length,
    elsewhere: citations.filter((c) => c.status === "elsewhere").length,
  };
}
