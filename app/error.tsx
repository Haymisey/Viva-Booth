"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
        <AlertCircle className="size-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mb-8 text-sm">
        An unexpected error occurred during execution. You can retry the operation or return to the home screen.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default" className="gap-2">
          <RotateCcw className="size-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="size-4" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
