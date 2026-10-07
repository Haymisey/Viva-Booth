"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { NAV_LINKS } from "./nav-links";
import { authClient } from "@/lib/auth-client";

interface NavMobileProps {
  isLoginPage?: boolean;
}

export function NavMobile({ isLoginPage = false }: NavMobileProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: session } = authClient.useSession();

  return (
    <div className="md:hidden">
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Mobile Dropdown Drawer */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full border-b border-border/60 bg-background/95 backdrop-blur-2xl px-4 pt-2 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {!isLoginPage && (
            <div className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-border/40">
            {isLoginPage ? (
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="w-full block"
              >
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            ) : session?.user ? (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full block"
              >
                <Button className="w-full gap-2">
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="w-full block"
              >
                <Button className="w-full gap-2">
                  <LogIn className="size-4" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
