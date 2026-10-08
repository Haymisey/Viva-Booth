import Link from "next/link";

type Props = {
  href?: string;
  className?: string;
};

export function Wordmark({ href = "/", className = "wordmark" }: Props) {
  return (
    <Link href={href} className={className} aria-label="Viva home">
      Viva<span className="brand-period">.</span>
    </Link>
  );
}
