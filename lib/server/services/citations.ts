import { significantTokens } from "@/lib/citation-match";

export type ExtractedFields = {
  title?: string;
  authors?: string;
  year?: number;
  doi?: string;
  rawText: string;
};

export type RefVerificationStatus = "VERIFIED" | "AMBIGUOUS" | "NOT_FOUND" | "ERROR";
export type RefSourceProvider = "SCHOLARXIV" | "OPENALEX";

export type VerificationResult = {
  status: RefVerificationStatus;
  source?: RefSourceProvider;
  matchedId?: string;
  confidence: number;
  hitTitle?: string;
  summary?: string;
};

// Regex patterns for heuristic extraction
const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/;
const YEAR_REGEX = /\b((?:19|20)\d{2})\b/;
const QUOTED_TITLE_REGEX = /["“'‘]([^"“'‘]{5,200})["”'’]/;

/**
 * Computes token-set Dice coefficient similarity between two paper titles.
 * Dice = (2 * |A ∩ B|) / (|A| + |B|)
 */
export function titleSimilarity(titleA: string, titleB: string): number {
  const tokensA = new Set(significantTokens(titleA));
  const tokensB = new Set(significantTokens(titleB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  return (2 * intersection) / (tokensA.size + tokensB.size);
}

/**
 * Fast, heuristic-first reference field extraction with optional Gemini fallback.
 */
export async function extractFields(
  raw: string,
  keys?: { gemini?: string }
): Promise<ExtractedFields> {
  const clean = raw.trim();
  const result: ExtractedFields = { rawText: clean };

  // 1. Extract DOI
  const doiMatch = clean.match(DOI_REGEX);
  if (doiMatch) {
    result.doi = doiMatch[1].replace(/[.,;]$/, "");
  }

  // 2. Extract Year
  const yearMatch = clean.match(YEAR_REGEX);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1], 10);
  }

  // 3. Extract Title heuristically from quotes or segments
  const quoteMatch = clean.match(QUOTED_TITLE_REGEX);
  if (quoteMatch) {
    result.title = quoteMatch[1].trim();
  } else {
    // Standard format heuristic: Author (Year). Title. Journal...
    const parts = clean.split(/[.?!]\s+/);
    if (parts.length >= 2) {
      // Find candidate part that isn't just authors or year
      for (const part of parts) {
        const p = part.trim();
        if (p.length > 15 && !YEAR_REGEX.test(p) && !p.toLowerCase().includes("doi.org")) {
          result.title = p;
          break;
        }
      }
    }
  }

  // 4. Fallback to Gemini if heuristic couldn't find a title and a key is provided
  const geminiKey = keys?.gemini || process.env.GEMINI_API_KEY?.trim();
  if (!result.title && geminiKey) {
    try {
      const prompt = `Extract academic reference metadata from this string as strict JSON:
"${clean}"
Return ONLY JSON format: {"title": "string or null", "authors": "string or null", "year": number or null, "doi": "string or null"}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.title) result.title = parsed.title;
          if (parsed.authors) result.authors = parsed.authors;
          if (parsed.year && typeof parsed.year === "number") result.year = parsed.year;
          if (parsed.doi) result.doi = parsed.doi;
        }
      }
    } catch {
      // Keep heuristic extraction on failure
    }
  }

  // If still no title, use the cleanest slice as title query
  if (!result.title) {
    result.title = clean.slice(0, 150);
  }

  return result;
}

type ProviderHit = {
  title?: string;
  abstract?: string;
  year?: number;
  doi?: string;
  id?: string;
};

async function queryWithTimeoutAndRetry(
  queryFn: () => Promise<Response>,
  retries = 1
): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await queryFn();
      if (res.ok) return res;
      if (res.status >= 500 && i < retries) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      return res;
    } catch {
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }
  return null;
}

/**
 * Searches Scholarxiv API with 8s timeout and retry on 5xx
 */
async function searchScholarxivService(
  query: string,
  apiKey?: string
): Promise<ProviderHit[] | null> {
  const key = apiKey || process.env.SCHOLARXIV_API_KEY?.trim();
  if (!key) return null;

  const res = await queryWithTimeoutAndRetry(() =>
    fetch(
      `https://www.scholarxiv.com/api/v1/papers/search?q=${encodeURIComponent(query)}&limit=3`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    )
  );

  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.data || data?.results || [];
    return rows.map((r: any) => ({
      title: r.title || r.paper?.title,
      abstract: r.abstract || r.paper?.abstract,
      id: r.id || r.doi,
    }));
  } catch {
    return null;
  }
}

/**
 * Searches OpenAlex API with polite-pool mailto, 8s timeout, and retry on 5xx
 */
async function searchOpenAlexService(query: string): Promise<ProviderHit[] | null> {
  const mailto = process.env.OPENALEX_MAILTO?.trim() || "team@viva-booth.org";
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=3&mailto=${encodeURIComponent(mailto)}`;

  const res = await queryWithTimeoutAndRetry(() =>
    fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    })
  );

  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    if (!Array.isArray(data.results)) return [];

    return data.results.map((work: any) => ({
      title: work.display_name,
      doi: work.doi ? work.doi.replace("https://doi.org/", "") : undefined,
      year: work.publication_year,
      id: work.id,
    }));
  } catch {
    return null;
  }
}

/**
 * Verifies a reference against Scholarxiv first, then OpenAlex fallback.
 * Applies token-set Dice similarity matching with strict confidence thresholds.
 */
export async function verifyReference(
  parsed: ExtractedFields,
  keys?: { scholarxiv?: string }
): Promise<VerificationResult> {
  const searchQuery = parsed.title || parsed.rawText.slice(0, 150);

  // 1. Direct DOI verification if DOI is provided
  if (parsed.doi) {
    const openAlexDoiHit = await queryWithTimeoutAndRetry(() =>
      fetch(`https://api.openalex.org/works/https://doi.org/${encodeURIComponent(parsed.doi!)}`, {
        signal: AbortSignal.timeout(6000),
      })
    );
    if (openAlexDoiHit && openAlexDoiHit.ok) {
      try {
        const doiData = await openAlexDoiHit.json();
        return {
          status: "VERIFIED",
          source: "OPENALEX",
          matchedId: doiData.id || parsed.doi,
          confidence: 1.0,
          hitTitle: doiData.display_name,
          summary: `Exact DOI match found: ${doiData.display_name}`,
        };
      } catch {
        // Continue to text search
      }
    }
  }

  // 2. Primary: Try Scholarxiv
  let scholarxivHits: ProviderHit[] | null = null;
  try {
    scholarxivHits = await searchScholarxivService(searchQuery, keys?.scholarxiv);
  } catch {
    scholarxivHits = null;
  }

  if (scholarxivHits && scholarxivHits.length > 0) {
    for (const hit of scholarxivHits) {
      if (!hit.title) continue;
      const sim = titleSimilarity(parsed.title || parsed.rawText, hit.title);

      if (sim >= 0.85) {
        return {
          status: "VERIFIED",
          source: "SCHOLARXIV",
          matchedId: hit.id,
          confidence: Math.round(sim * 100) / 100,
          hitTitle: hit.title,
          summary: hit.abstract ? hit.abstract.slice(0, 300) : hit.title,
        };
      }
      if (sim >= 0.60) {
        return {
          status: "AMBIGUOUS",
          source: "SCHOLARXIV",
          matchedId: hit.id,
          confidence: Math.round(sim * 100) / 100,
          hitTitle: hit.title,
          summary: `Partial match: "${hit.title}"`,
        };
      }
    }
  }

  // 3. Fallback: Try OpenAlex
  let openAlexHits: ProviderHit[] | null = null;
  try {
    openAlexHits = await searchOpenAlexService(searchQuery);
  } catch {
    openAlexHits = null;
  }

  if (openAlexHits && openAlexHits.length > 0) {
    for (const hit of openAlexHits) {
      if (!hit.title) continue;
      const sim = titleSimilarity(parsed.title || parsed.rawText, hit.title);
      const yearMatches = !parsed.year || !hit.year || Math.abs(parsed.year - hit.year) <= 1;

      if (sim >= 0.85 && yearMatches) {
        return {
          status: "VERIFIED",
          source: "OPENALEX",
          matchedId: hit.id || hit.doi,
          confidence: Math.round(sim * 100) / 100,
          hitTitle: hit.title,
          summary: `Found on OpenAlex: "${hit.title}" (${hit.year || "n.d."})`,
        };
      }
      if (sim >= 0.60) {
        return {
          status: "AMBIGUOUS",
          source: "OPENALEX",
          matchedId: hit.id || hit.doi,
          confidence: Math.round(sim * 100) / 100,
          hitTitle: hit.title,
          summary: `Ambiguous match on OpenAlex: "${hit.title}"`,
        };
      }
    }
  }

  // 4. Determine final status
  // If both providers returned network/5xx errors or null (neither could respond)
  if (scholarxivHits === null && openAlexHits === null) {
    return {
      status: "ERROR",
      confidence: 0,
      summary: "Verification service temporarily unavailable.",
    };
  }

  return {
    status: "NOT_FOUND",
    confidence: 0,
    summary: "Reference could not be located in Scholarxiv or OpenAlex.",
  };
}
