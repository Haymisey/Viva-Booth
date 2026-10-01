import { formatTime } from "@/components/booth/SessionBar";
import type { SessionRecord } from "@/lib/sessions";

type Props = {
  sessions: SessionRecord[];
  onClear: () => void;
  onOpen?: (session: SessionRecord) => void;
};

function day(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function RecentTakes({ sessions, onClear, onOpen }: Props) {
  if (sessions.length === 0) {
    return (
      <section>
        <h2 className="font-display text-4xl text-ink">Takes</h2>
        <p className="mt-3 text-[15px] text-ink/60">Stop a session and it lands here.</p>
      </section>
    );
  }

  return (
    <section>
      <header className="flex items-baseline justify-between gap-6">
        <h2 className="font-display text-3xl text-ink">Recent takes</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-ink/60 underline-offset-4 hover:text-ink hover:underline"
        >
          Clear
        </button>
      </header>
      <p className="mt-1 text-sm text-ink/55">Saved in this browser only.</p>

      <ul className="mt-5 divide-y divide-rule rounded-2xl border border-rule bg-card">
        {sessions.map((s) => (
          <li key={s.id}>
            <details className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="min-w-0">
                  <span className="font-display block truncate text-lg text-ink">{s.title}</span>
                  <span className="text-sm text-ink/60">
                    {[day(s.at), formatTime(s.seconds), `Take ${s.take}`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex gap-2 text-xs font-medium">
                  <span className="rounded-full bg-moss/10 px-2.5 py-0.5 text-moss">
                    {s.inCorpus} in corpus
                  </span>
                  {s.notFound > 0 ? (
                    <span className="rounded-full bg-rust/5 px-2.5 py-0.5 text-rust">
                      {s.notFound} not found
                    </span>
                  ) : null}
                </span>
                {onOpen ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      onOpen(s);
                    }}
                    className="text-sm text-ink/70 underline-offset-4 hover:text-ink hover:underline"
                  >
                    Continue
                  </button>
                ) : null}
              </summary>
              <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 text-[15px] leading-relaxed text-ink/80">
                {s.say ? (
                  <p className="font-display text-lg italic text-ink">“{s.say}”</p>
                ) : null}
                {s.questionNote ? <p>{s.questionNote}</p> : null}
                {s.questions && s.questions.length > 0 ? (
                  <ol className="list-decimal pl-5">
                    {s.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                ) : null}
                {s.transcript ? (
                  <p className="line-clamp-3 text-sm text-ink/60">{s.transcript}</p>
                ) : null}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
