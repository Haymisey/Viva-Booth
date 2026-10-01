export type BoothView = "home" | "practice" | "manuscripts" | "takes" | "settings";

const items: { id: BoothView; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "practice", label: "Practice" },
  { id: "manuscripts", label: "Manuscripts" },
  { id: "takes", label: "Takes" },
  { id: "settings", label: "Settings" },
];

type Props = {
  view: BoothView;
  onChange: (view: BoothView) => void;
};

export function Sidebar({ view, onChange }: Props) {
  return (
    <aside className="flex gap-1 overflow-x-auto border-b border-rule px-4 py-4 md:w-56 md:shrink-0 md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:border-r md:px-5 md:py-8">
      <p className="font-display mb-6 hidden text-5xl text-ink md:block">Viva</p>
      {items.map((item) => {
        const on = item.id === view;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`rounded-full px-3 py-2 text-left text-sm ${
              on ? "bg-ink text-paper" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        );
      })}
      <p className="font-display mt-auto hidden pt-10 text-sm italic leading-snug text-ink/55 md:block">
        Better thoughts.
        <br />
        Clearer words.
      </p>
    </aside>
  );
}
