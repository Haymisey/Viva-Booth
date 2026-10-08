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
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
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

    // Check credits if on free plan
    if (user.plan === "free" && user.credits <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "You have used all your free defense takes. Upgrade to Pro for unlimited sessions.",
          needsUpgrade: true,
        },
        { status: 403 }
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
        questionNote: questionNote || null,
        citationsJson: JSON.stringify(citations),
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
      include: {
        messages: true,
      },
    });

    // Deduct 1 credit if on free plan
    if (user.plan === "free") {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      });
    }

    return NextResponse.json({ ok: true, session: newSession });
  } catch (error) {
    console.error("Save session error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
