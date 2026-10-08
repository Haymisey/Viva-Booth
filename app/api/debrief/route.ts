import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateDebrief, judgeAnswers, talkWordCount } from "@/lib/gemini";
import { formatPaperForPrompt, parsePaperJson } from "@/lib/paper";
import { recentCoachNotes } from "@/lib/session-memory";
import { withUserGemini } from "@/lib/server/keys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: string;
      abstract?: string;
      citations?: { text: string; status: string; hitTitle?: string }[];
      language?: string;
      questions?: unknown;
      followUps?: boolean;
      seconds?: number;
      paper?: unknown;
    };
    const language = body.language === "am" ? "am" : "en";
    const questions = Array.isArray(body.questions)
      ? body.questions.filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      : [];
    if (questions.length > 0) {
      const judged = await withUserGemini(() =>
        judgeAnswers({
          language,
          transcript: body.transcript ?? "",
          questions,
          followUps: body.followUps === true,
        }),
      );
      const text = [
        `Keep: ${judged.keep}`,
        ...judged.verdicts.map(
          (v) =>
            `${v.mark === "answered" ? "Answered" : v.mark === "missed" ? "Missed" : "Partial"}: ${v.say}`,
        ),
      ].join("\n");
      return NextResponse.json({ text, verdicts: judged.verdicts, followUps: judged.followUps });
    }
    const transcript = body.transcript ?? "";
    const seconds = typeof body.seconds === "number" && Number.isFinite(body.seconds) ? body.seconds : 0;
    const user = await getSessionUser().catch(() => null);
    const paper = formatPaperForPrompt(parsePaperJson(body.paper));
    const packed = body.abstract?.trim()
      ? `${paper}\n\nPacked abstract:\n${body.abstract.trim()}`
      : paper;
    const text = await withUserGemini(() =>
      generateDebrief({
        transcript,
        citations: Array.isArray(body.citations) ? body.citations : [],
        seconds,
        wordCount: talkWordCount(transcript),
        language,
        paper: packed,
        priorNotes: await recentCoachNotes(user?.id),
      }),
    );
    if (!text) return NextResponse.json({ error: "Debrief failed" }, { status: 502 });
    return NextResponse.json({ text, verdicts: [], followUps: [] });
  } catch (err) {
    const quota = err instanceof Error && err.message === "QUOTA";
    return NextResponse.json(
      {
        error: quota
          ? "Gemini's free limit is full. Wait a minute, then press Stop again."
          : "Debrief failed",
      },
      { status: quota ? 429 : 500 },
    );
  }
}
