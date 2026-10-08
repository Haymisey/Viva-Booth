"use client";

import type { ReactNode } from "react";
import type { SessionPhase } from "@/lib/types";

type Props = {
  phase: SessionPhase;
  elapsedSeconds: number;
  startLabel: string;
  stopLabel: string;
  onStart: () => void;
  onStop: () => void;
  extra?: ReactNode;
};

export function formatTime(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const pill =
  "inline-flex min-w-32 items-center justify-center rounded-full px-6 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function SessionBar({ phase, elapsedSeconds, startLabel, stopLabel, onStart, onStop, extra }: Props) {
  const canStart = phase !== "talking";
  const canStop = phase === "talking";

  return (
    <div className="flex flex-col items-center text-center">
      <p className="font-display text-8xl leading-none tabular-nums text-ink md:text-9xl">
        {formatTime(elapsedSeconds)}
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={onStart} disabled={!canStart} className={`${pill} bg-ink text-paper hover:bg-ink/85`}>
          {startLabel}
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={!canStop}
          className={`${pill} border border-ink/30 bg-transparent text-ink hover:border-ink/60`}
        >
          {stopLabel}
        </button>
      </div>
      {extra}
    </div>
  );
}
