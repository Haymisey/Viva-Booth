import type { Verdict } from "./gemini";
import type { Citation } from "./types";

export type DebriefResult = {
  text: string;
  failed: boolean;
  verdicts: Verdict[];
  followUps: string[];
};

export async function requestDebrief(input: {
  transcript: string;
  abstract: string;
  citations: Citation[];
  language: "en" | "am";
  questions?: string[];
  followUps?: boolean;
}) {
  try {
    const res = await fetch("/api/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: input.transcript,
        abstract: input.abstract,
        citations: input.citations.map((c) => ({
          text: c.text,
          status: c.status,
          hitTitle: c.hitTitle,
        })),
        language: input.language,
        questions: input.questions ?? [],
        followUps: input.followUps === true,
      }),
    });
    if (!res.ok) return { text: "", failed: true, verdicts: [], followUps: [] } satisfies DebriefResult;
    const data = (await res.json()) as { text?: string; verdicts?: Verdict[]; followUps?: string[] };
    return {
      text: data.text ?? "",
      failed: false,
      verdicts: Array.isArray(data.verdicts) ? data.verdicts : [],
      followUps: Array.isArray(data.followUps) ? data.followUps : [],
    } satisfies DebriefResult;
  } catch {
    return { text: "", failed: true, verdicts: [], followUps: [] } satisfies DebriefResult;
  }
}
