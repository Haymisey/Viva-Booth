import { NextResponse } from "next/server";
import { formatDebrief, generateDebrief } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: string;
      abstract?: string;
      citations?: { text: string; status: string; hitTitle?: string }[];
      language?: string;
    };
    const result = await generateDebrief({
      transcript: body.transcript ?? "",
      abstract: body.abstract ?? "",
      citations: Array.isArray(body.citations) ? body.citations : [],
      language: body.language === "am" ? "am" : "en",
    });
    return NextResponse.json({ text: formatDebrief(result) });
  } catch {
    return NextResponse.json({ error: "Debrief failed" }, { status: 500 });
  }
}
