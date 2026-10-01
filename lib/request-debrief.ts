import type { Citation } from "./types";

export type DebriefResult = {
  text: string;
  failed: boolean;
};

export async function requestDebrief(input: {
  transcript: string;
  abstract: string;
  citations: Citation[];
  language: "en" | "am";
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
      }),
    });
    if (!res.ok) return { text: "", failed: true } satisfies DebriefResult;
    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "", failed: false } satisfies DebriefResult;
  } catch {
    return { text: "", failed: true } satisfies DebriefResult;
  }
}
