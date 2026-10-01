import type { CitationStatus } from "@/lib/types";

const labels: Record<CitationStatus, string> = {
  pending: "Checking",
  in_corpus: "In corpus",
  not_found: "Not found",
  unverified: "Unverified",
};

const tones: Record<CitationStatus, string> = {
  pending: "border-rule text-ink/55",
  in_corpus: "border-moss/30 bg-moss/10 text-moss",
  not_found: "border-rust/35 bg-rust/5 text-rust",
  unverified: "border-rule bg-ink/[0.03] text-ink/60",
};

export function Badge({ status }: { status: CitationStatus }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[status]}`}
    >
      {labels[status]}
    </span>
  );
}
