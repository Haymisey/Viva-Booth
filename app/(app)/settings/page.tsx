import type { Metadata } from "next";
import { getUser } from "@/lib/server/session";
import { Settings, Shield, KeyRound, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Settings className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account &amp; System Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your profile, API keys, and voice simulation preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <div className="border border-border/80 bg-card rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <h2 className="font-semibold text-base">User Profile</h2>
            </div>
            <Badge variant="outline" className="text-xs uppercase font-mono">
              {user?.plan || "free"} plan
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm pt-2">
            <div>
              <span className="text-xs text-muted-foreground block">Email</span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Name</span>
              <span className="font-medium text-foreground">{user?.name || "Candidate"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Account Role</span>
              <span className="font-medium text-foreground capitalize">{user?.role || "student"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Available Credits</span>
              <span className="font-medium text-foreground">{user?.credits ?? 5}</span>
            </div>
          </div>
        </div>

        {/* API Keys & Dev Mode Card */}
        <div className="border border-border/80 bg-card rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <h2 className="font-semibold text-base">API Keys &amp; AI Engines</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Custom BYOK (Bring Your Own Key) for Gemini 2.5 Flash and Scholarxiv credentials will be configurable here (Phase 5).
          </p>
        </div>

        {/* Security Card */}
        <div className="border border-border/80 bg-card rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <h2 className="font-semibold text-base">Security &amp; Sessions</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Session management is powered by Better Auth PostgreSQL database sessions. Password updates and active device revocation will be active in Phase 5.
          </p>
        </div>
      </div>
    </div>
  );
}
