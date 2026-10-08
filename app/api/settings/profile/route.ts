import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  return NextResponse.json({
    ok: true,
    name: row?.name?.trim() || "",
    email: row?.email || user.email,
  });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (name.length < 1 || name.length > 80) {
    return NextResponse.json({ ok: false, error: "Name must be between 1 and 80 characters." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });

  return NextResponse.json({ ok: true, name });
}
