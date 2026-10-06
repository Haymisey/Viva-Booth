import type { AuthUser } from "@/components/auth/AuthModal";

export type BoothView = "home" | "practice" | "manuscripts" | "takes" | "settings";

const items: { id: BoothView; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "🏛" },
  { id: "practice", label: "Practice", icon: "🎙" },
  { id: "takes", label: "Takes & Chat", icon: "💬" },
  { id: "manuscripts", label: "Manuscripts", icon: "📄" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

type Props = {
  view: BoothView;
  onChange: (view: BoothView) => void;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenUpgrade: () => void;
};

export function Sidebar({
  view,
  onChange,
  user,
  onOpenAuth,
  onLogout,
  onOpenUpgrade,
}: Props) {
  return (
    <aside className="flex gap-1 overflow-x-auto border-b border-rule px-4 py-4 md:w-64 md:shrink-0 md:flex-col md:gap-1.5 md:overflow-visible md:border-b-0 md:border-r md:px-5 md:py-8">
      <div className="mb-6 hidden md:block">
        <p className="font-display text-5xl text-ink">Viva</p>
        <p className="text-xs text-ink/50 mt-1 font-mono uppercase tracking-wider">
          Defense Booth
        </p>
      </div>

      {/* Navigation items */}
      <div className="flex gap-1 md:flex-col">
        {items.map((item) => {
          const on = item.id === view;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-left text-sm transition ${
                on
                  ? "bg-ink text-paper font-medium"
                  : "text-ink/70 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Account & Billing Widget */}
      <div className="mt-auto hidden pt-8 md:flex md:flex-col gap-3 border-t border-rule/70">
        {user ? (
          <div className="rounded-2xl border border-rule bg-card p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink truncate max-w-[120px]">{user.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  user.plan === "pro"
                    ? "bg-moss/10 text-moss"
                    : "bg-ink/10 text-ink/75"
                }`}
              >
                {user.plan}
              </span>
            </div>
            <p className="mt-1 text-ink/55 truncate">{user.email}</p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink/65 border-t border-rule/50 pt-2">
              <span>{user.plan === "pro" ? "Unlimited" : `${user.credits} takes left`}</span>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="text-ink font-medium underline underline-offset-2 hover:opacity-80"
              >
                {user.plan === "pro" ? "Manage" : "Upgrade"}
              </button>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-2.5 w-full text-center text-[11px] text-ink/45 hover:text-rust transition"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-rule bg-card p-3.5 text-xs text-center">
            <p className="font-medium text-ink">Candidate Account</p>
            <p className="mt-1 text-[11px] text-ink/60 leading-snug">
              Save defense takes, view chat history, & unlock Pro.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="mt-3 w-full rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-ink/85 transition"
            >
              Sign In / Register
            </button>
          </div>
        )}

        <p className="font-display text-xs italic leading-snug text-ink/45 px-1">
          Better thoughts.
          <br />
          Clearer words.
        </p>
      </div>
    </aside>
  );
}
