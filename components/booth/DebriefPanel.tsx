import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { copyFor } from "@/lib/copy";
import type { Verdict } from "@/lib/gemini";
import type { AppLanguage, Citation } from "@/lib/types";

type Props = {
  transcript: string;
  citations: Citation[];
  debrief: string;
  language?: AppLanguage;
  verdicts?: Verdict[];
};

const markLabel: Record<Verdict["mark"], string> = {
  answered: "Answered",
  partial: "Partial",
  missed: "Missed",
};

type DebriefLine = { kind: string; text: string };

function sectionLabel(kind: string) {
  const name = kind.toLowerCase();
  if (name === "keep" || name === "fix" || name === "say") {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return kind;
}

function parseDebrief(text: string): DebriefLine[] {
  const out: DebriefLine[] = [];
  for (const line of text.split("\n").map((row) => row.trim()).filter(Boolean)) {
    const match = line.replace(/\*/g, "").trim().match(/^(Keep|Fix|Say):\s*(.*)$/i);
    if (match) {
      out.push({ kind: sectionLabel(match[1]), text: match[2] });
      continue;
    }
    const previous = out[out.length - 1];
    if (previous) previous.text = `${previous.text} ${line}`.trim();
    else out.push({ kind: "", text: line });
  }
  return out;
}

function Pane({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <article className="flex min-h-[12rem] flex-col md:px-8 md:first:pl-0 md:last:pr-0">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <span className="mt-2 block h-px w-16 bg-ink/40" />
      <div className="mt-5 flex-1 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </article>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-ink/50">{children}</p>;
}

export function DebriefPanel({ transcript, citations, debrief, language = "en", verdicts = [] }: Props) {
  const lines = parseDebrief(debrief);
  const text = copyFor(language);
  const heading = (kind: string) => {
    if (kind === "Keep") return text.keep;
    if (kind === "Fix") return text.fix;
    if (kind === "Say") return text.say;
    return kind;
  };

  return (
    <section className="grid gap-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-rule">
      <Pane title={text.transcript}>
        {transcript ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : (
          <Empty>{text.nothingSpoken}</Empty>
        )}
      </Pane>

      <Pane title={text.citations}>
        {citations.length === 0 ? (
          <Empty>{text.citationsEmpty}</Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {citations.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-3 border-l-2 border-rule pl-3"
              >
                <span className="min-w-0">
                  <span className="text-ink">“{c.text}”</span>
                  {c.hitTitle ? (
                    <span className="mt-1 block text-sm text-ink/60">{c.hitTitle}</span>
                  ) : null}
                  {c.status === "not_found" && c.closestTitle ? (
                    <span className="mt-1 block text-sm text-ink/50">{text.closest}: {c.closestTitle}</span>
                  ) : null}
                </span>
                <Badge status={c.status} language={language} />
              </li>
            ))}
          </ul>
        )}
      </Pane>

      <Pane title={language === "am" ? text.sayIt : <><em>Say it</em> like this</>}>
        {verdicts.length > 0 ? (
          <div className="flex flex-col gap-5">
            {verdicts.map((v, i) => (
              <div key={i}>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/55">
                  {i + 1} · {markLabel[v.mark] ?? "Partial"}
                </p>
                <p className="mt-1 text-sm text-ink/65">{v.question}</p>
                <p className="font-display mt-2 text-lg italic text-ink">“{v.say}”</p>
              </div>
            ))}
          </div>
        ) : lines.length === 0 ? (
          <Empty>{text.noteEmpty}</Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {lines.map((line, i) => (
              <div key={i}>
                {line.kind ? (
                  <p className="font-display text-lg text-ink">{heading(line.kind)}.</p>
                ) : null}
                <p className={line.kind === "Keep" || line.kind === "Say" ? "font-display text-lg italic text-ink" : ""}>
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </Pane>
    </section>
  );
}
