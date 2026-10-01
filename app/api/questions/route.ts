import { NextResponse } from "next/server";
import { generateExaminerQuestions } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      language?: string;
      abstract?: string;
      transcript?: string;
      count?: number;
      matchedElsewhere?: boolean;
      hits?: { title?: string; abstract?: string }[];
    };
    const hits = Array.isArray(body.hits)
      ? body.hits
          .filter((h): h is { title: string; abstract?: string } => typeof h?.title === "string" && h.title.trim().length > 0)
          .map((h) => ({
            title: h.title.trim(),
            abstract: typeof h.abstract === "string" ? h.abstract : undefined,
          }))
      : [];
    const turn = await generateExaminerQuestions({
      language: body.language === "am" ? "am" : "en",
      abstract: body.abstract ?? "",
      transcript: body.transcript ?? "",
      count: body.count === 2 ? 2 : 4,
      matchedElsewhere: body.matchedElsewhere === true,
      hits,
    });
    return NextResponse.json(turn);
  } catch {
    return NextResponse.json({ error: "Questions failed" }, { status: 500 });
  }
}
