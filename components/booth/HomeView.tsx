import { Button } from "@/components/ui/Button";
import { formatTime } from "@/components/booth/SessionBar";
import type { SessionRecord } from "@/lib/sessions";

type Props = {
  name: string;
  sessions: SessionRecord[];
  onTalk: () => void;
  onManuscript: () => void;
  onOpenTakes: () => void;
  onResume: (session: SessionRecord) => void;
};

function day(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export function HomeView({ name, sessions, onTalk, onManuscript, onOpenTakes, onResume }: Props) {
  const recent = sessions.slice(0, 4);
  const greeting = name.trim() ? `Good morning, ${name.trim()}.` : "Turn your ideas into clear speech.";

  return (
    <div className="flex flex-col gap-12">
      <header>
        <h2 className="font-display text-4xl text-ink md:text-5xl">{greeting}</h2>
        {name.trim() ? (
          <p className="mt-2 text-[15px] text-ink/65">Turn your ideas into clear speech.</p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-rule bg-card p-6 md:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/55">Open talk</p>
        <h3 className="font-display mt-2 text-3xl text-ink">Start a new conversation</h3>
        <p className="mt-2 max-w-md text-[15px] text-ink/70">
          Speak naturally. Viva listens, checks what you cite, and asks from what you said.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={onTalk}>
            Start talking
          </Button>
          <Button type="button" tone="line" onClick={onManuscript}>
            New manuscript
          </Button>
        </div>
      </section>

      <section>
        <header className="flex items-baseline justify-between">
          <h3 className="font-display text-3xl text-ink">Recent</h3>
          {sessions.length > 0 ? (
            <button
              type="button"
              onClick={onOpenTakes}
              className="text-sm text-ink/60 hover:text-ink"
            >
              View all
            </button>
          ) : null}
        </header>
        {recent.length === 0 ? (
          <p className="mt-4 text-[15px] text-ink/55">A finished take lands here.</p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {recent.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onResume(s)}
                  className="w-full rounded-2xl border border-rule bg-card px-5 py-4 text-left hover:border-ink/30"
                >
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/50">
                  {s.mode === "open" ? "Speech" : "Manuscript"}
                </p>
                <p className="font-display mt-1 text-xl text-ink">{s.title}</p>
                <p className="mt-1 text-sm text-ink/60">
                  {day(s.at)} · {formatTime(s.seconds)}
                </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
