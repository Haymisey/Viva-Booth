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
    const session = await prisma.session.findUnique({
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
    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const examinerReplyText = await generateExaminerReply({
      sessionTitle: session.title,
      transcript: session.transcript,
      history,
      studentReply: cleanAnswer,
    });

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
