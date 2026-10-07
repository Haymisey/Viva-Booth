import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

interface NavLoginButtonProps {
  isLoginPage?: boolean
}

export function NavLoginButton({ isLoginPage = false }: NavLoginButtonProps) {
  if (isLoginPage) {
    return (
      <Link href="/">
        <Button variant="outline" size="sm">
          Back to Home
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/login">
      <Button size="sm" className="gap-1.5 font-medium shadow-md shadow-primary/20">
        <LogIn className="size-3.5" />
        <span>Login</span>
      </Button>
    </Link>
  )
}
