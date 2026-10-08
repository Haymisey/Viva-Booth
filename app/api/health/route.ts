import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  let dbStatus = "unknown";

  try {
    // Ping database with a simple SELECT 1 query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "disconnected";
    console.warn("Health check DB ping warning:", err);
  }

  return NextResponse.json({
    ok: true,
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
