import { Button } from "@/components/ui/Button";
import type { Citation, ExaminerPack, SessionPhase } from "@/lib/types";

type Props = {
  pack: ExaminerPack;
  phase: SessionPhase;
  transcript: string;
  citations: Citation[];
  say: string;
  onEdit: () => void;
};

function lineCount(text: string) {
  if (!text.trim()) return 0;
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim()).length;
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-rule py-2.5 last:border-b-0">
      <span className="text-sm text-ink/70">{label}</span>
      <span className="text-sm tabular-nums text-ink">{value}</span>
    </div>
  );
}

export function ExaminerPackCard({ pack, phase, transcript, citations, say, onEdit }: Props) {
  const open = pack.mode === "open";
  const refs = pack.citations.length;
  const live = phase === "talking";

  return (
    <section className="grid gap-8 rounded-2xl border border-rule bg-card p-6 md:grid-cols-[1.3fr_1fr_1.1fr] md:gap-0 md:divide-x md:divide-rule md:p-8">
      <div className="flex min-w-0 flex-col md:pr-8">
        <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-ink/60">
          {open ? "Open talk" : "Prepared"}
          {live ? (
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-moss">
              <span className="h-1.5 w-1.5 rounded-full bg-moss" />
              Live
            </span>
          ) : null}
        </p>
        <h2 className="font-display mt-2 text-3xl leading-tight text-ink md:text-4xl">
          {open ? "Open talk" : pack.title || "Untitled"}
        </h2>
        <p className="mt-2 text-[15px] text-ink/65">
          {open
            ? "Citations come from your speech after you stop."
            : [pack.question, refs ? `${refs} references` : "No references"]
                .filter(Boolean)
                .join(" · ")}
        </p>
        <div className="mt-auto pt-6">
          <Button type="button" tone="line" onClick={onEdit} disabled={live}>
            Edit manuscript
          </Button>
        </div>
      </div>

      <div className="md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/60">This session</p>
        <div className="mt-3">
          <Row label="Transcript" value={lineCount(transcript)} />
          <Row label="Citations" value={citations.length} />
          <Row label="In corpus" value={citations.filter((c) => c.status === "in_corpus").length} />
        </div>
      </div>

      <div className="md:pl-8">
        <div className="h-full rounded-xl bg-paper px-5 py-5">
          <p className="text-sm text-ink/60">Say it like this:</p>
          {say ? (
            <p className="font-display mt-3 text-xl italic leading-snug text-ink">“{say}”</p>
          ) : (
            <p className="mt-3 text-[15px] text-ink/50">Your replacement line appears after you stop.</p>
          )}
        </div>
      </div>
    </section>
  );
}
