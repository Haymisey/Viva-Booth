"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { SessionUser } from "@/lib/server/session";
import { UserMenu } from "./UserMenu";
import {
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Sparkles,
  Menu,
  X,
  Coins,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  user: SessionUser;
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "New Project",
      href: "/projects/new",
      icon: PlusCircle,
      active: pathname === "/projects/new",
    },
    {
      name: "Booth",
      href: "/legacy-booth",
      icon: Sparkles,
      active: pathname === "/legacy-booth" || pathname?.startsWith("/booth"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname?.startsWith("/settings"),
    },
  ];

  return (
    <nav className="border-b border-border/70 bg-card/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand and Primary Links */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-foreground">
              Viva<span className="text-primary font-normal">Booth</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5",
                    link.active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Credits, UserMenu, Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Credits indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-background/80 text-xs font-medium text-muted-foreground">
            <Coins className="size-3.5 text-amber-400" />
            <span>
              <strong className="text-foreground font-semibold">{user.credits}</strong> credits
            </span>
          </div>

          {/* User profile dropdown */}
          <UserMenu user={user} />

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  link.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between px-3 text-xs text-muted-foreground">
            <span>Available credits</span>
            <Badge variant="outline" className="gap-1 font-mono">
              <Coins className="size-3 text-amber-400" />
              <span>{user.credits}</span>
            </Badge>
          </div>
        </div>
      )}
    </nav>
  );
}
