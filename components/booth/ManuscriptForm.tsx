"use client";

import { useMemo, useState } from "react";
import { TextArea, TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Manuscript } from "@/lib/types";

type Props = {
  value: Manuscript;
  onChange: (next: Manuscript) => void;
  onPrepare: () => void;
  onOpenTalk: () => void;
  disabled: boolean;
};

export function ManuscriptForm({
  value,
  onChange,
  onPrepare,
  onOpenTalk,
  disabled,
}: Props) {
  const filled = value.references.filter((r) => r.trim()).length;
  const [shown, setShown] = useState(() => Math.min(5, Math.max(1, filled || 1)));

  const visible = useMemo(
    () => value.references.slice(0, shown),
    [value.references, shown],
  );

  const setRef = (index: number, text: string) => {
    const references = [...value.references] as Manuscript["references"];
    references[index] = text;
    onChange({ ...value, references });
  };

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-rule bg-card p-6 md:p-8">
      <header className="max-w-lg">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/60">
          Manuscript
        </p>
        <h2 className="font-display mt-2 text-3xl leading-tight text-ink">
          Read this first, then listen.
        </h2>
        <p className="mt-2 text-[15px] text-ink/65">
          Title, question, abstract, up to five references. Or skip it and open talk.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Title"
          placeholder="The work you will defend"
          value={value.title}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
        <TextField
          label="Question"
          placeholder="One sentence"
          value={value.question}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, question: e.target.value })}
        />
      </div>
      <TextArea
        label="Abstract"
        placeholder="Paste the abstract only"
        value={value.abstract}
        disabled={disabled}
        rows={4}
        onChange={(e) => onChange({ ...value, abstract: e.target.value })}
      />
      <div className="grid gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
          References
        </p>
        {visible.map((ref, i) => (
          <TextField
            key={i}
            label={`Ref ${i + 1}`}
            placeholder="Author, year, title"
            value={ref}
            disabled={disabled}
            onChange={(e) => setRef(i, e.target.value)}
          />
        ))}
        {shown < 5 ? (
          <Button
            type="button"
            tone="ghost"
            className="self-start px-0"
            disabled={disabled}
            onClick={() => setShown((n) => n + 1)}
          >
            Add a reference
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onPrepare} disabled={disabled}>
          Prepare
        </Button>
        <Button type="button" tone="line" onClick={onOpenTalk} disabled={disabled}>
          Open talk
        </Button>
      </div>
    </section>
  );
}
