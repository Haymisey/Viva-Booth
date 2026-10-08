import * as React from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="px-4 py-4 sm:px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-85"
        >
          <div className="size-9 rounded-xl bg-gradient-to-tr from-primary/80 via-primary to-indigo-400 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            Viva<span className="text-primary font-normal">Booth</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to site</span>
        </Link>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Dark Glow Effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-primary/20 via-indigo-600/15 to-transparent blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute bottom-0 right-10 w-[450px] h-[350px] bg-gradient-to-tl from-indigo-500/10 via-purple-500/10 to-transparent blur-[100px] rounded-full" />

        <div className="relative w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
