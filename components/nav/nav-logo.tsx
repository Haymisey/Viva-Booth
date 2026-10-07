import * as React from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function NavLogo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/80 via-primary to-violet-400 text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
        <GraduationCap className="size-5" />
        <div className="absolute inset-0 rounded-xl bg-primary/20 blur-sm group-hover:blur-md transition-all" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          VivaBooth
        </span>
        <Badge
          variant="outline"
          className="hidden sm:inline-flex text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/10"
        >
          Thesis Defense AI
        </Badge>
      </div>
    </Link>
  )
}
