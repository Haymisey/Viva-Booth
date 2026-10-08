import type { PaperContext } from "./paper";
import type { Citation } from "./types";

export async function requestQuestions(input: {
  language: "en" | "am";
  abstract: string;
  transcript: string;
  seconds: number;
  citations: Citation[];
  count?: number;
  paper?: PaperContext | null;
}): Promise<{ note: string | null; questions: string[] } | null> {
  const hits: { title: string; abstract?: string }[] = [];
  const seen = new Set<string>();
  const take = (status: "in_corpus" | "elsewhere") => {
    for (const c of input.citations) {
      if (c.status !== status || !c.hitTitle) continue;
      const k = c.hitTitle.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      hits.push({ title: c.hitTitle, abstract: c.hitAbstract });
    }
  };
  take("in_corpus");
  const corpusCount = hits.length;
  if (corpusCount === 0) take("elsewhere");
  try {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: input.language,
        abstract: input.abstract,
        transcript: input.transcript,
        seconds: input.seconds,
        paper: input.paper ?? null,
        count: input.count === 1 ? 1 : input.count === 2 ? 2 : 4,
        matchedElsewhere: corpusCount === 0 && hits.length > 0,
        hits,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { note?: unknown; questions?: unknown };
    if (!Array.isArray(data.questions)) return null;
    const questions = data.questions
      .filter((q): q is string => typeof q === "string")
      .map((q) => q.trim())
      .filter(Boolean);
    if (questions.length === 0) return null;
    const note = typeof data.note === "string" && data.note.trim() ? data.note.trim() : null;
    return { note, questions };
  } catch {
    return null;
  }
}
