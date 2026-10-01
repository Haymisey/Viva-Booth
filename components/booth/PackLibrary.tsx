import { packLabel } from "@/lib/library";
import type { ExaminerPack } from "@/lib/types";

type Props = {
  packs: ExaminerPack[];
  activeId: string | null;
  onSelect: (pack: ExaminerPack) => void;
};

export function PackLibrary({ packs, activeId, onSelect }: Props) {
  if (packs.length === 0) return null;

  return (
    <nav className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-[0.12em] text-ink/55">Saved</span>
      {packs.map((pack) => {
        const on = pack.id === activeId;
        return (
          <button
            key={pack.id}
            type="button"
            onClick={() => onSelect(pack)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              on
                ? "bg-ink text-paper"
                : "border border-ink/20 text-ink/75 hover:border-ink/50 hover:text-ink"
            }`}
          >
            {packLabel(pack)}
          </button>
        );
      })}
    </nav>
  );
}
