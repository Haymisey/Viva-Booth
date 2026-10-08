import Link from "next/link";
import { getUser } from "@/lib/server/session";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <LayoutDashboard className="size-4" />
            <span>Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            Welcome back, {user?.name || "Candidate"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Plan, practice, and prepare for your thesis oral examination
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/legacy-booth">
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Sparkles className="size-4" />
              <span>Open Viva Booth</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-border/80 bg-card rounded-2xl p-6 shadow-sm space-y-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <GraduationCap className="size-5" />
          </div>
          <h3 className="font-semibold text-lg">Simulation Sessions</h3>
          <p className="text-sm text-muted-foreground">
            Practice mock questions with simulated committee examiners in English or Amharic.
          </p>
          <div className="pt-2">
            <Link href="/legacy-booth">
              <Button variant="outline" size="sm" className="w-full">
                Practice Now
              </Button>
            </Link>
          </div>
        </div>

        <div className="border border-border/80 bg-card rounded-2xl p-6 shadow-sm space-y-3">
          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Sparkles className="size-5" />
          </div>
          <h3 className="font-semibold text-lg">Active Plan</h3>
          <p className="text-sm text-muted-foreground">
            Current Tier: <strong className="text-foreground capitalize">{user?.plan || "Free"}</strong> • {user?.credits ?? 5} credits remaining.
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" className="w-full" disabled>
              Managed Tier
            </Button>
          </div>
        </div>

        <div className="border border-border/80 bg-card rounded-2xl p-6 shadow-sm space-y-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <LayoutDashboard className="size-5" />
          </div>
          <h3 className="font-semibold text-lg">New Project Canvas</h3>
          <p className="text-sm text-muted-foreground">
            Figma-like project workspace is coming in Phase 3 with literature citation verification.
          </p>
          <div className="pt-2">
            <Button variant="ghost" size="sm" className="w-full" disabled>
              Phase 3 Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
