import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "./Wordmark";

export function SiteHeader({
  simple = false,
  backHref = "/",
  backLabel = "Back to Viva",
}: {
  simple?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="site-header">
      <Wordmark />
      {simple ? null : <span className="header-note">A little practice. A clearer voice.</span>}
      <nav aria-label="Main navigation">
        {simple ? (
          <Link href={backHref} className="quiet-button">
            {backLabel} <ArrowUpRight size={14} />
          </Link>
        ) : (
          <>
            <Link href="/auth/signin" className="quiet-button">
              Sign in
            </Link>
            <Link href="/auth/signup" className="viva-button">
              Get started <ArrowUpRight size={14} />
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
