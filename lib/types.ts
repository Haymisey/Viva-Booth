export type SessionPhase = "idle" | "prepared" | "talking" | "stopped";

export type SessionMode = "open" | "prepared";

export type AppLanguage = "en" | "am";

export type CitationStatus = "pending" | "in_corpus" | "elsewhere" | "not_found" | "unverified";

export type Manuscript = {
  title: string;
  question: string;
  abstract: string;
  references: [string, string, string, string, string];
};

export type Citation = {
  id: string;
  text: string;
  status: CitationStatus;
  source: "manuscript" | "speech";
  hitTitle?: string;
  hitAbstract?: string;
  closestTitle?: string;
};

export type ExaminerPack = {
  id: string;
  mode: SessionMode;
  packedAt: string;
  title: string;
  question: string;
  abstract: string;
  citations: Citation[];
};
