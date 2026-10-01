import type { ButtonHTMLAttributes } from "react";

type Tone = "solid" | "ghost" | "line";

const tones: Record<Tone, string> = {
  solid:
    "bg-ink text-paper hover:bg-ink/85 disabled:bg-ink/25 disabled:text-paper/80",
  ghost: "text-ink/75 hover:text-ink hover:bg-ink/5 disabled:text-ink/35",
  line: "border border-ink/25 text-ink hover:border-ink/60 disabled:opacity-40",
};

export function Button({
  tone = "solid",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
