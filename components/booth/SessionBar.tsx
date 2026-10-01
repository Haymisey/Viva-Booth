"use client";

import { Button } from "@/components/ui/Button";
import type { SessionPhase } from "@/lib/types";

type Props = {
  phase: SessionPhase;
  elapsedSeconds: number;
  startLabel: string;
  stopLabel: string;
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

export function SessionBar({ phase, elapsedSeconds, startLabel, stopLabel, onStart, onStop }: Props) {
  const canStart = phase !== "talking";
  const canStop = phase === "talking";

  return (
    <div className="flex flex-col items-center text-center">
      <p className="font-display text-8xl leading-none tabular-nums text-ink md:text-9xl">
        {formatTime(elapsedSeconds)}
      </p>
      <div className="mt-8 flex gap-3">
        <Button type="button" onClick={onStart} disabled={!canStart} className="min-w-32">
          {startLabel}
        </Button>
        <Button type="button" tone="line" onClick={onStop} disabled={!canStop} className="min-w-32">
          {stopLabel}
        </Button>
      </div>
    </div>
  );
}
