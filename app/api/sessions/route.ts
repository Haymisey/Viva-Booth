import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        seconds: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, sessions });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please log in or create an account to save sessions." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      packId,
      mode = "open",
      take = 1,
      seconds = 0,
      transcript = "",
      inCorpus = 0,
      notFound = 0,
      unverified = 0,
      say = "",
      debrief = "",
      questionNote = null,
      questions = [],
      citations = [],
      paper = null,
    } = body;

    const newSession = await prisma.practiceSession.create({
      data: {
        userId: user.id,
        title: title || "Open Defense Talk",
        packId: packId || null,
        mode,
        take: Number(take) || 1,
        seconds: Number(seconds) || 0,
        transcript: String(transcript),
        inCorpus: Number(inCorpus) || 0,
        notFound: Number(notFound) || 0,
        unverified: Number(unverified) || 0,
        say: say || null,
        debrief: debrief || null,
        questionNote: questionNote || (paper ? JSON.stringify(paper) : null),
        citationsJson: JSON.stringify(citations),
        paperJson: paper ? JSON.stringify(paper) : null,
        // If initial questions were generated, add the first question as an examiner opening message
        messages: Array.isArray(questions) && questions.length > 0
          ? {
              create: questions.map((q: string) => ({
                role: "examiner",
                content: q,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({ ok: true, session: newSession });
  } catch (error) {
    console.error("Save session error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
