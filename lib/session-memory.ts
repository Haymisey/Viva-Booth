import { prisma } from "./db";
import { parsePaperJson } from "./paper";

function firstLabeled(debrief: string | null, label: string) {
  if (!debrief) return "";
  const match = debrief.match(new RegExp(`^${label}:\\s*(.*)$`, "im"));
  return match?.[1]?.trim().slice(0, 180) ?? "";
}

export async function recentCoachNotes(userId: string | null | undefined) {
  if (!userId) return "";
  try {
    const sessions = await prisma.practiceSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { title: true, seconds: true, debrief: true, paperJson: true, questionNote: true },
    });
    if (sessions.length === 0) return "";
    return sessions
      .map((session, index) => {
        const paper = parsePaperJson(session.paperJson) ?? parsePaperJson(session.questionNote);
        const keep = firstLabeled(session.debrief, "KEEP") || firstLabeled(session.debrief, "Keep");
        const fix = firstLabeled(session.debrief, "FIX") || firstLabeled(session.debrief, "Fix");
        const paperBit = paper?.title ? ` paper="${paper.title}"` : "";
        return `${index + 1}. "${session.title}" ${session.seconds}s${paperBit}. KEEP: ${keep || "—"}. FIX: ${fix || "—"}.`;
      })
      .join("\n");
  } catch {
    return "";
  }
}
