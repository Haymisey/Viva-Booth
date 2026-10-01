"use client";

import { Button } from "@/components/ui/Button";
import type { SessionPhase } from "@/lib/types";

type Props = {
  phase: SessionPhase;
  elapsedSeconds: number;
  take: 1 | 2;
  onStart: () => void;
  onStop: () => void;
};

export function formatTime(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const captions: Record<SessionPhase, string> = {
  idle: "Prepare a manuscript or open talk, then start.",
  prepared: "The voice bar is the mic. Start is the clock.",
  talking: "Speak your defence. Ignore the assistant.",
  stopped: "Stopped. Start again for a second take.",
};

export function SessionBar({ phase, elapsedSeconds, take, onStart, onStop }: Props) {
  const canStart = phase === "prepared" || phase === "stopped";
  const canStop = phase === "talking";

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/55">
        {phase === "talking" ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss" />
            Take {take} · live
          </span>
        ) : (
          `Take ${take}`
        )}
      </p>
      <p className="font-display mt-2 text-8xl leading-none tabular-nums text-ink md:text-9xl">
        {formatTime(elapsedSeconds)}
      </p>
      <div className="mt-8 flex gap-3">
        <Button type="button" onClick={onStart} disabled={!canStart} className="min-w-32">
          Start
        </Button>
        <Button type="button" tone="line" onClick={onStop} disabled={!canStop} className="min-w-32">
          Stop
        </Button>
      </div>
      <p className="mt-4 max-w-sm text-sm text-ink/60">{captions[phase]}</p>
    </div>
  );
}
