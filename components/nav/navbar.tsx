"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { NavLogo } from "./nav-logo";
import { NavLinks } from "./nav-links";
import { NavLoginButton } from "./nav-login-button";
import { NavMobile } from "./nav-mobile";

export function Navbar() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname?.startsWith("/auth");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Most Left: Icon and Brand Logo */}
        <NavLogo />

        {/* Most Right: Navigation Links + Last Navlink is Login Button */}
        <div className="hidden md:flex items-center gap-2">
          {!isLoginPage && <NavLinks />}

          {/* Last Navlink */}
          <div className="ml-2 pl-2 border-l border-border/50">
            <NavLoginButton isLoginPage={isLoginPage} />
          </div>
        </div>

        {/* Mobile View */}
        <NavMobile isLoginPage={isLoginPage} />
      </div>
    </header>
  );
}
