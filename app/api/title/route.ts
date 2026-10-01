import { NextResponse } from "next/server";
import { nameTalk } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { transcript?: unknown };
    const transcript = typeof body.transcript === "string" ? body.transcript : "";
    const title = await nameTalk(transcript);
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ error: "Title failed" }, { status: 500 });
  }
}
