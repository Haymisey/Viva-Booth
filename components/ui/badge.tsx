import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { CitationStatus, AppLanguage } from "@/lib/types"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: "primary" | "secondary" | "neutral" | "caution" | "critical" | "success";
  status?: CitationStatus;
  language?: AppLanguage;
}

function Badge({
  className,
  variant,
  tone,
  status,
  language = "en",
  children,
  ...props
}: BadgeProps) {
  let computedVariant = variant || "default";
  let content = children;

  if (status) {
    const isAm = language === "am";
    if (status === "in_corpus") {
      computedVariant = "default";
      content = isAm ? "ተገኝቷል" : "In Corpus";
    } else if (status === "not_found") {
      computedVariant = "destructive";
      content = isAm ? "አልተገኘም" : "Not Found";
    } else {
      computedVariant = "secondary";
      content = isAm ? "ያልተረጋገጠ" : "Unverified";
    }
  } else if (tone) {
    if (tone === "critical") computedVariant = "destructive";
    else if (tone === "secondary" || tone === "neutral") computedVariant = "secondary";
    else if (tone === "caution" || tone === "success") computedVariant = "outline";
    else computedVariant = "default";
  }

  return (
    <div
      className={cn(badgeVariants({ variant: computedVariant }), className)}
      {...props}
    >
      {content}
    </div>
  )
}

export { Badge, badgeVariants }
