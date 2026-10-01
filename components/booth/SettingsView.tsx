import type { AppLanguage } from "@/lib/types";

type Props = {
  name: string;
  language: AppLanguage;
  onName: (name: string) => void;
  onLanguage: (language: AppLanguage) => void;
};

export function SettingsView({ name, language, onName, onLanguage }: Props) {
  return (
    <div className="flex max-w-lg flex-col gap-8">
      <header>
        <h2 className="font-display text-4xl text-ink">Settings</h2>
        <p className="mt-2 text-[15px] text-ink/65">Saved in this browser. No account.</p>
      </header>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
          Name
        </span>
        <input
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="Shown on the home screen"
          className="w-full border-b border-ink/20 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-ink/35 focus:border-ink"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
          Language
        </span>
        <select
          value={language}
          onChange={(event) => onLanguage(event.target.value === "am" ? "am" : "en")}
          className="rounded-full border border-ink/20 bg-card px-3 py-2 text-sm text-ink outline-none"
        >
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
        </select>
      </label>
    </div>
  );
}
