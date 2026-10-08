export const PAPER_MAX_BYTES = 10 * 1024 * 1024;
export const PAPER_MAX_PAGES = 20;
export const PAPER_MAX_CHARS = 18000;

export type PaperContext = {
  title: string;
  question: string;
  excerpt: string;
  fileName: string;
};

export function emptyPaper(): PaperContext {
  return { title: "", question: "", excerpt: "", fileName: "" };
}

export function hasPaper(paper: PaperContext) {
  return Boolean(paper.excerpt.trim() || paper.title.trim() || paper.question.trim());
}

export function clipExcerpt(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, PAPER_MAX_CHARS);
}

export function parsePaperJson(raw: unknown): PaperContext | null {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return parsePaperJson(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const paper: PaperContext = {
    title: typeof row.title === "string" ? row.title.trim().slice(0, 200) : "",
    question: typeof row.question === "string" ? row.question.trim().slice(0, 400) : "",
    excerpt: typeof row.excerpt === "string" ? clipExcerpt(row.excerpt) : "",
    fileName: typeof row.fileName === "string" ? row.fileName.trim().slice(0, 180) : "",
  };
  return hasPaper(paper) || paper.fileName ? paper : null;
}

export function formatPaperForPrompt(paper?: PaperContext | null) {
  if (!paper || !hasPaper(paper)) return "(none)";
  return `Title: ${paper.title || "(untitled)"}
Research question: ${paper.question || "(not given)"}
Excerpt (may be truncated):
${(paper.excerpt || "(none)").slice(0, 8000)}`;
}
