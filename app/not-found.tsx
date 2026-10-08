import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <GraduationCap className="size-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8 text-sm">
        The defense rehearsal or page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
