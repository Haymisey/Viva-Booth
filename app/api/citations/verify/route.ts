import { NextResponse } from "next/server";
import { isUsefulClosest, titleMatchesClaim } from "@/lib/citation-match";
import { searchOpenAlex } from "@/lib/openalex";
import { searchScholarxiv } from "@/lib/scholarxiv";
import type { PaperHit } from "@/lib/scholarxiv";
import type { CitationStatus } from "@/lib/types";

export const runtime = "nodejs";

type Row = {
  query: string;
  status: CitationStatus;
  title?: string;
  abstract?: string;
  closest?: string;
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
    const same = (hits: PaperHit[]) => hits.find((h) => h.title && titleMatchesClaim(query, h.title));
    const hits = await searchScholarxiv(query);
    if (hits === null) {
      results.push({ query, status: "unverified" });
      continue;
    }
    const corpus = same(hits);
    if (corpus?.title) {
      results.push({
        query,
        status: "in_corpus",
        title: corpus.title,
        abstract: corpus.abstract,
      });
      continue;
    }
    const outside = await searchOpenAlex(query);
    const other = outside ? same(outside) : undefined;
    if (other?.title) {
      results.push({
        query,
        status: "elsewhere",
        title: other.title,
        abstract: other.abstract,
      });
      continue;
    }
    const pool = [...hits, ...(outside ?? [])];
    const closest = pool.find((h) => h.title && isUsefulClosest(query, h.title))?.title;
    results.push({ query, status: "not_found", closest });
  }

  return NextResponse.json({ results });
}
