import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "New Project",
};

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            <span>Dashboard</span>
          </Button>
        </Link>
      </div>

      <div className="border border-border/80 bg-card rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <PlusCircle className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Research Project</h1>
            <p className="text-muted-foreground text-sm">
              Upload manuscript details and prepare for oral defense simulation
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-dashed border-border bg-muted/30 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Project creation &amp; citation verification wizard is configured for Phase 3.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/practice">
              <Button size="sm">Open Legacy Viva Booth</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
