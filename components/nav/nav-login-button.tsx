"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface NavLoginButtonProps {
  isLoginPage?: boolean;
}

export function NavLoginButton({ isLoginPage = false }: NavLoginButtonProps) {
  const { data: session } = authClient.useSession();

  if (isLoginPage) {
    return (
      <Link href="/">
        <Button variant="outline" size="sm">
          Back to Home
        </Button>
      </Link>
    );
  }

  if (session?.user) {
    return (
      <Link href="/dashboard">
        <Button size="sm" className="gap-1.5 font-medium shadow-md shadow-primary/20">
          <LayoutDashboard className="size-3.5" />
          <span>Open Dashboard</span>
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/auth/signin">
      <Button size="sm" className="gap-1.5 font-medium shadow-md shadow-primary/20">
        <LogIn className="size-3.5" />
        <span>Login</span>
      </Button>
    </Link>
  );
}
