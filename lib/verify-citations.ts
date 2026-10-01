import type { Citation, CitationStatus } from "./types";

type Row = {
  query: string;
  status: CitationStatus;
  title?: string;
  abstract?: string;
};

export type VerifyResult = {
  citations: Citation[];
  failed: boolean;
};

export async function verifyCitations(list: Citation[]): Promise<VerifyResult> {
  if (list.length === 0) return { citations: [], failed: false };
  try {
    const res = await fetch("/api/citations/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: list.map((c) => c.text) }),
    });
    if (!res.ok) {
      return {
        citations: list.map((c) => ({ ...c, status: "unverified" as const })),
        failed: true,
      };
    }
    const data = (await res.json()) as { results?: Row[] };
    const rows = data.results ?? [];
    return {
      citations: list.map((c, i) => {
        const row = rows[i];
        if (!row) return { ...c, status: "unverified" as const };
        return {
          ...c,
          status: row.status,
          hitTitle: row.title,
          hitAbstract: row.abstract,
        };
      }),
      failed: false,
    };
  } catch {
    return {
      citations: list.map((c) => ({ ...c, status: "unverified" as const })),
      failed: true,
    };
  }
}
