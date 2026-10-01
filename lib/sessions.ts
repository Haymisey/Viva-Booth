import type { Citation, SessionMode } from "./types";

export type SessionRecord = {
  id: string;
  packId: string;
  title: string;
  mode: SessionMode;
  take: 1 | 2;
  at: string;
  seconds: number;
  transcript: string;
  inCorpus: number;
  notFound: number;
  unverified: number;
  say: string;
  questions: [string, string] | null;
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

export function sayLine(debrief: string) {
  return debrief.match(/^Say:\s*(.+)$/m)?.[1]?.trim() ?? "";
}

export function countStatuses(citations: Citation[]) {
  return {
    inCorpus: citations.filter((c) => c.status === "in_corpus").length,
    notFound: citations.filter((c) => c.status === "not_found").length,
    unverified: citations.filter((c) => c.status === "unverified").length,
  };
}
