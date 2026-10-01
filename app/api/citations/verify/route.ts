import { NextResponse } from "next/server";
import { titleMatchesClaim } from "@/lib/citation-match";
import { searchScholarxiv } from "@/lib/scholarxiv";
import type { CitationStatus } from "@/lib/types";

export const runtime = "nodejs";

type Row = {
  query: string;
  status: CitationStatus;
  title?: string;
  abstract?: string;
};

export async function POST(request: Request) {
  let queries: string[] = [];
  try {
    const body = (await request.json()) as { queries?: unknown };
    if (Array.isArray(body.queries)) {
      queries = body.queries.filter((q): q is string => typeof q === "string" && q.trim().length > 0);
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sliced = queries.slice(0, 8);
  const results: Row[] = [];

  for (const query of sliced) {
    const hits = await searchScholarxiv(query);
    if (hits === null) {
      results.push({ query, status: "unverified" });
      continue;
    }
    if (hits.length === 0) {
      results.push({ query, status: "not_found" });
      continue;
    }
    const match = hits.find((h) => h.title && titleMatchesClaim(query, h.title));
    if (!match?.title) {
      results.push({ query, status: "not_found" });
      continue;
    }
    results.push({
      query,
      status: "in_corpus",
      title: match.title,
      abstract: match.abstract,
    });
  }

  return NextResponse.json({ results });
}
