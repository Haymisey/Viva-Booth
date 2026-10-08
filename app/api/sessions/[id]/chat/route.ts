import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateExaminerReply } from "@/lib/examiner-chat";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const session = await prisma.practiceSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const { answer } = body;

    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json({ ok: false, error: "Answer cannot be empty" }, { status: 400 });
    }

    const cleanAnswer = answer.trim();

    // 1. Record the candidate's answer
    const studentMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "student",
        content: cleanAnswer,
      },
    });

    // 2. Generate examiner feedback and follow-up question
    const history = session.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const { parsePaperJson } = await import("@/lib/paper");
    const { recentCoachNotes } = await import("@/lib/session-memory");
    const { talkWordCount } = await import("@/lib/gemini");
    const examinerReplyText = await generateExaminerReply({
      sessionTitle: session.title,
      transcript: session.transcript,
      history,
      studentReply: cleanAnswer,
      paper: parsePaperJson(session.paperJson),
      priorNotes: await recentCoachNotes(user.id),
      wordCount: talkWordCount(session.transcript),
    });
    if (!examinerReplyText) {
      return NextResponse.json({ ok: false, error: "Examiner failed" }, { status: 502 });
    }

    // 3. Record examiner's response
    const examinerMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "examiner",
        content: examinerReplyText,
      },
    });

    return NextResponse.json({
      ok: true,
      studentMessage,
      examinerMessage,
    });
  } catch (error) {
    console.error("Examiner chat error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
