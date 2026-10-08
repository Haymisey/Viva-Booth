import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (!currentPassword) {
    return NextResponse.json({ ok: false, error: "Current password is required." }, { status: 400 });
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not change password. Check the current password and try again." },
      { status: 400 },
    );
  }
}
