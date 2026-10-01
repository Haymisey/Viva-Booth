import { NextResponse } from "next/server";
import { generateExaminerQuestions } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      language?: string;
      abstract?: string;
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
    const questions = await generateExaminerQuestions({
      language: body.language === "am" ? "am" : "en",
      abstract: body.abstract ?? "",
      hits,
    });
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ error: "Questions failed" }, { status: 500 });
  }
}
