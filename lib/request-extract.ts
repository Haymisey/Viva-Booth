export type ExtractResult = {
  queries: string[];
  failed: boolean;
};

export async function requestExtract(transcript: string): Promise<ExtractResult> {
  if (!transcript.trim()) return { queries: [], failed: false };
  try {
    const res = await fetch("/api/citations/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) return { queries: [], failed: true };
    const data = (await res.json()) as { queries?: unknown };
    if (!Array.isArray(data.queries)) return { queries: [], failed: true };
    return {
      queries: data.queries.filter(
        (q): q is string => typeof q === "string" && q.trim().length > 0,
      ),
      failed: false,
    };
  } catch {
    return { queries: [], failed: true };
  }
}
