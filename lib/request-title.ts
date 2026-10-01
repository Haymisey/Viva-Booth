export async function requestTitle(transcript: string): Promise<string> {
  if (!transcript.trim()) return "Open talk";
  try {
    const res = await fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { title?: unknown };
    return typeof data.title === "string" ? data.title.trim() : "";
  } catch {
    return "";
  }
}
