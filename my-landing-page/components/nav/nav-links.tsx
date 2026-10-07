import * as React from "react"

export interface NavItem {
  name: string
  href: string
}

export const NAV_LINKS: NavItem[] = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Showcase", href: "#showcase" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
]

export function NavLinks() {
  return (
    <div className="hidden md:flex items-center gap-1 lg:gap-2">
      {NAV_LINKS.map((link) => (
        <a
          key={link.name}
          href={link.href}
          className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {link.name}
        </a>
      ))}
    </div>
  )
}
