import * as React from "react";
import { SessionUser } from "@/lib/server/session";
import { TopNav } from "./TopNav";

interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopNav user={user} />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
