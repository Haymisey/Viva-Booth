import type { AppLanguage, CitationStatus } from "@/lib/types";

import { copyFor } from "@/lib/copy";

const tones: Record<CitationStatus, string> = {
  pending: "border-rule text-ink/55",
  in_corpus: "border-moss/30 bg-moss/10 text-moss",
  elsewhere: "border-ink/20 bg-ink/5 text-ink/80",
  not_found: "border-rust/35 bg-rust/5 text-rust",
  unverified: "border-rule bg-ink/[0.03] text-ink/60",
};

export function Badge({ status, language = "en" }: { status: CitationStatus; language?: AppLanguage }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[status]}`}
    >
      {copyFor(language).badge[status]}
    </span>
  );
}
