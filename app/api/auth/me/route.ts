import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ ok: false, user: null }, { status: 500 });
  }
}
