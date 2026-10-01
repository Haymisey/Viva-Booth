import type { PaperHit } from "./scholarxiv";

function abstractFromIndex(index: unknown): string | undefined {
  if (!index || typeof index !== "object") return undefined;
  const pairs: { word: string; at: number }[] = [];
  for (const [word, spots] of Object.entries(index as Record<string, unknown>)) {
    if (!Array.isArray(spots)) continue;
    for (const at of spots) {
      if (typeof at === "number") pairs.push({ word, at });
    }
  }
  if (pairs.length === 0) return undefined;
  pairs.sort((a, b) => a.at - b.at);
  return pairs
    .map((p) => p.word)
    .join(" ")
    .slice(0, 600);
}

/** OpenAlex is a second shelf. A hit here is not a Scholarxiv in-corpus result. */
export async function searchOpenAlex(query: string): Promise<PaperHit[] | null> {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=3`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: unknown[] };
    if (!Array.isArray(data.results)) return [];
    return data.results.map((row) => {
      const work = row as { display_name?: unknown; abstract_inverted_index?: unknown };
      return {
        title: typeof work.display_name === "string" ? work.display_name : undefined,
        abstract: abstractFromIndex(work.abstract_inverted_index),
      };
    });
  } catch {
    return null;
  }
}
