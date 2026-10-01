import type { Citation } from "./types";

export type QuestionPair = [string, string];

export async function requestQuestions(input: {
  language: "en" | "am";
  abstract: string;
  citations: Citation[];
}): Promise<QuestionPair | null> {
  const hits: { title: string; abstract?: string }[] = [];
  const seen = new Set<string>();
  for (const c of input.citations) {
    if (c.status !== "in_corpus" || !c.hitTitle) continue;
    const k = c.hitTitle.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    hits.push({ title: c.hitTitle, abstract: c.hitAbstract });
  }
  try {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: input.language,
        abstract: input.abstract,
        hits,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { questions?: unknown };
    if (!Array.isArray(data.questions) || data.questions.length < 2) return null;
    const a = typeof data.questions[0] === "string" ? data.questions[0].trim() : "";
    const b = typeof data.questions[1] === "string" ? data.questions[1].trim() : "";
    if (!a || !b) return null;
    return [a, b];
  } catch {
    return null;
  }
}
