import { NextResponse } from "next/server";
import { formatDebrief, generateDebrief, judgeAnswers } from "@/lib/gemini";

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
    };
    const language = body.language === "am" ? "am" : "en";
    const questions = Array.isArray(body.questions)
      ? body.questions.filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      : [];
    if (questions.length > 0) {
      const judged = await judgeAnswers({
        language,
        transcript: body.transcript ?? "",
        questions,
        followUps: body.followUps === true,
      });
      const text = [
        `Keep: ${judged.keep}`,
        ...judged.verdicts.map(
          (v) =>
            `${v.mark === "answered" ? "Answered" : v.mark === "missed" ? "Missed" : "Partial"}: ${v.say}`,
        ),
      ].join("\n");
      return NextResponse.json({ text, verdicts: judged.verdicts, followUps: judged.followUps });
    }
    const result = await generateDebrief({
      transcript: body.transcript ?? "",
      abstract: body.abstract ?? "",
      citations: Array.isArray(body.citations) ? body.citations : [],
      language,
    });
    return NextResponse.json({ text: formatDebrief(result), verdicts: [], followUps: [] });
  } catch {
    return NextResponse.json({ error: "Debrief failed" }, { status: 500 });
  }
}
