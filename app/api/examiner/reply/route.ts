import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateExaminerReply } from "@/lib/examiner-chat";
import { parsePaperJson, type PaperContext } from "@/lib/paper";
import { recentCoachNotes } from "@/lib/session-memory";
import { withUserGemini } from "@/lib/server/keys";
import { talkIsReady, talkWordCount } from "@/lib/talk-ready";

export const runtime = "nodejs";

type HistoryTurn = { role: string; content: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: string;
      seconds?: number;
      answer?: string;
      language?: string;
      sessionId?: string;
      paper?: PaperContext | null;
      history?: HistoryTurn[];
    };
    const transcript = String(body.transcript ?? "");
    const seconds = typeof body.seconds === "number" ? body.seconds : 0;
    const answer = String(body.answer ?? "").trim();
    if (!answer) {
      return NextResponse.json({ error: "Answer cannot be empty" }, { status: 400 });
    }
    if (!talkIsReady(seconds, transcript)) {
      return NextResponse.json({ error: "Talk is too short to examine." }, { status: 400 });
    }

    const user = await getSessionUser().catch(() => null);
    const paper = parsePaperJson(body.paper);
    const history = Array.isArray(body.history)
      ? body.history
          .filter((turn) => typeof turn?.content === "string" && turn.content.trim())
          .map((turn) => ({
            role: turn.role === "student" ? "student" : "examiner",
            content: turn.content.trim(),
          }))
      : [];

    let sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (user && sessionId) {
      const session = await prisma.practiceSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== user.id) sessionId = "";
    } else {
      sessionId = "";
    }

    const priorNotes = await recentCoachNotes(user?.id);
    const text = await withUserGemini(() => generateExaminerReply({
      sessionTitle: paper?.title || "Open defense talk",
      transcript,
      history,
      studentReply: answer,
      paper,
      priorNotes,
      language: body.language === "am" ? "am" : "en",
      wordCount: talkWordCount(transcript),
    }));
    if (!text) {
      return NextResponse.json({ error: "Examiner failed" }, { status: 502 });
    }

    if (user && sessionId) {
      await prisma.chatMessage.create({
        data: { sessionId, role: "student", content: answer },
      });
      await prisma.chatMessage.create({
        data: { sessionId, role: "examiner", content: text },
      });
    }

    return NextResponse.json({ text });
  } catch (error) {
    const quota = error instanceof Error && error.message === "QUOTA";
    return NextResponse.json(
      { error: quota ? "Gemini's free limit is full. Wait a minute, then try again." : "Examiner failed" },
      { status: quota ? 429 : 500 },
    );
  }
}
