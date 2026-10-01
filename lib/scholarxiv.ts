export type PaperHit = {
  title?: string;
  abstract?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function textField(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function titleOf(row: unknown): string | undefined {
  const r = asRecord(row);
  if (!r) return undefined;
  const inner = asRecord(r.paper) ?? r;
  return textField(inner, ["title", "ti", "name"]);
}

function abstractOf(row: unknown): string | undefined {
  const r = asRecord(row);
  if (!r) return undefined;
  const inner = asRecord(r.paper) ?? r;
  return textField(inner, ["abstract", "summary", "abs", "description"]);
}

function collectPapers(payload: unknown): PaperHit[] {
  if (Array.isArray(payload)) {
    return payload.map((row) => ({ title: titleOf(row), abstract: abstractOf(row) }));
  }
  const root = asRecord(payload);
  if (!root) return [];
  const bags = [root.data, root.papers, root.results, root.items, root.hits];
  for (const bag of bags) {
    if (Array.isArray(bag)) {
      return bag.map((row) => ({ title: titleOf(row), abstract: abstractOf(row) }));
    }
    const nested = asRecord(bag);
    if (nested) {
      const deeper = collectPapers(nested);
      if (deeper.length) return deeper;
    }
  }
  return [];
}

async function parse(res: Response): Promise<PaperHit[] | null> {
  if (!res.ok) return null;
  try {
    return collectPapers(await res.json());
  } catch {
    return null;
  }
}

export async function searchScholarxiv(query: string): Promise<PaperHit[] | null> {
  const key = process.env.SCHOLARXIV_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!key) return null;

  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const attempts: Array<() => Promise<Response>> = [
    () =>
      fetch(
        `https://www.scholarxiv.com/api/v1/papers/search?q=${encodeURIComponent(query)}&limit=3`,
        { headers, cache: "no-store" },
      ),
    () =>
      fetch("https://www.scholarxiv.com/api/v1/papers/search", {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({
          searchFilterString: { all: query },
          maxResults: 3,
          sortBy: "relevance",
          sortOrder: "descending",
        }),
      }),
    () =>
      fetch("https://scholarxiv.com/api/search_papers", {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({
          searchFilterString: { all: query },
          startIndex: 0,
          maxResults: 3,
          sortBy: "relevance",
          sortOrder: "descending",
        }),
      }),
  ];

  let emptyOk = false;
  for (const run of attempts) {
    try {
      const res = await run();
      const hits = await parse(res);
      if (hits && hits.length > 0) return hits;
      if (hits) emptyOk = true;
    } catch {
      /* try next shape */
    }
  }

  return emptyOk ? [] : null;
}
