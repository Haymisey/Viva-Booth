import type { Verdict } from "./gemini";
import type { PaperContext } from "./paper";
import type { Citation } from "./types";

export type DebriefResult = {
  text: string;
  failed: boolean;
  message: string;
  verdicts: Verdict[];
  followUps: string[];
};

export async function requestDebrief(input: {
  transcript: string;
  citations: Citation[];
  seconds: number;
  language: "en" | "am";
  paper?: PaperContext | null;
}) {
  try {
    const res = await fetch("/api/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: input.transcript,
        citations: input.citations.map((c) => ({
          text: c.text,
          status: c.status,
          hitTitle: c.hitTitle,
        })),
        seconds: input.seconds,
        language: input.language,
        paper: input.paper ?? null,
        questions: [],
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      return {
        text: "",
        failed: true,
        message: data?.error || "",
        verdicts: [],
        followUps: [],
      } satisfies DebriefResult;
    }
    const data = (await res.json()) as { text?: string; verdicts?: Verdict[]; followUps?: string[] };
    return {
      text: data.text ?? "",
      failed: false,
      message: "",
      verdicts: Array.isArray(data.verdicts) ? data.verdicts : [],
      followUps: Array.isArray(data.followUps) ? data.followUps : [],
    } satisfies DebriefResult;
  } catch {
    return { text: "", failed: true, message: "", verdicts: [], followUps: [] } satisfies DebriefResult;
  }
}
