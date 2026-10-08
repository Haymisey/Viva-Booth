import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { geminiKeyStatus, saveGeminiKey } from "@/lib/server/keys";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const status = await geminiKeyStatus(user.id);
  return NextResponse.json({ ok: true, geminiSet: status.set, masked: status.masked });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.geminiKey === null) {
    await saveGeminiKey(user.id, null);
    return NextResponse.json({ ok: true, geminiSet: false, masked: "" });
  }

  const key = String(body.geminiKey ?? "").trim();
  if (key.length < 20 || key.length > 200 || /\s/.test(key)) {
    return NextResponse.json({ ok: false, error: "That does not look like a Gemini key." }, { status: 400 });
  }

  try {
    await saveGeminiKey(user.id, key);
  } catch {
    return NextResponse.json({ ok: false, error: "Could not store the key." }, { status: 500 });
  }

  const status = await geminiKeyStatus(user.id);
  return NextResponse.json({ ok: true, geminiSet: status.set, masked: status.masked });
}
