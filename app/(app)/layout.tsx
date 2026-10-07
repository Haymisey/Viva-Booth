import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/server/session";
import { GraduationCap, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="border-b border-border/70 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <GraduationCap className="size-5" />
              </div>
              <span>
                Viva<span className="text-primary font-normal">Booth</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/legacy-booth"
                className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Booth</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden md:inline-block">
              {user.email}
            </span>
            <form action="/api/auth/sign-out" method="POST">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </Link>
            </form>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
