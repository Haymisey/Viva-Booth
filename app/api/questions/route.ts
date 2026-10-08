import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateExaminerQuestions } from "@/lib/gemini";
import { talkIsReady } from "@/lib/talk-ready";
import { formatPaperForPrompt, parsePaperJson } from "@/lib/paper";
import { recentCoachNotes } from "@/lib/session-memory";
import { withUserGemini } from "@/lib/server/keys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      language?: string;
      abstract?: string;
      transcript?: string;
      seconds?: number;
      count?: number;
      matchedElsewhere?: boolean;
      paper?: unknown;
      hits?: { title?: string; abstract?: string }[];
    };
    const transcript = body.transcript ?? "";
    const seconds = typeof body.seconds === "number" ? body.seconds : 0;
    if (!talkIsReady(seconds, transcript)) {
      return NextResponse.json({ error: "Talk is too short to examine." }, { status: 400 });
    }
    const hits = Array.isArray(body.hits)
      ? body.hits
          .filter((h): h is { title: string; abstract?: string } => typeof h?.title === "string" && h.title.trim().length > 0)
          .map((h) => ({
            title: h.title.trim(),
            abstract: typeof h.abstract === "string" ? h.abstract : undefined,
          }))
      : [];
    const user = await getSessionUser().catch(() => null);
    const paper = formatPaperForPrompt(parsePaperJson(body.paper));
    const abstract = [paper !== "(none)" ? paper : "", body.abstract ?? ""].filter(Boolean).join("\n\n");
    const priorNotes = await recentCoachNotes(user?.id);
    const turn = await withUserGemini(() =>
      generateExaminerQuestions({
        language: body.language === "am" ? "am" : "en",
        abstract,
        transcript,
        count: body.count === 1 ? 1 : body.count === 2 ? 2 : 4,
        matchedElsewhere: body.matchedElsewhere === true,
        hits,
        priorNotes,
      }),
    );
    return NextResponse.json(turn);
  } catch {
    return NextResponse.json({ error: "Questions failed" }, { status: 500 });
  }
}
