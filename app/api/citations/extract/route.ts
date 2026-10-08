import { NextResponse } from "next/server";
import { claimGroundedInTranscript } from "@/lib/citation-match";
import { extractCitationAttempts } from "@/lib/gemini";
import { withUserGemini } from "@/lib/server/keys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { transcript?: unknown };
    const transcript = typeof body.transcript === "string" ? body.transcript : "";
    if (!transcript.trim()) {
      return NextResponse.json({ queries: [] });
    }
    const raw = await withUserGemini(() => extractCitationAttempts(transcript));
    const queries = raw.filter((claim) => claimGroundedInTranscript(claim, transcript));
    return NextResponse.json({ queries: queries.slice(0, 8) });
  } catch {
    return NextResponse.json({ error: "Extract failed" }, { status: 500 });
  }
}
