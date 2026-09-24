import { BRAND } from "@/shared/brand";
import { cn } from "@/lib/utils";

export interface WordmarkProps {
  /** Font size in px (§5.1 ~20px; nav 700, auth/landing 900) */
  size?: number;
  className?: string;
}

/**
 * §5.1 wordmark — Plus Jakarta Sans, "Med" + primary "Vault".
 * Colour via tokens (text-ink / text-primary), size via inline em for crisp scaling.
 */
export function Wordmark({ size = 20, className }: WordmarkProps) {
  return (
    <span
      aria-label={BRAND.name}
      className={cn("font-heading text-ink-900 font-extrabold tracking-tight", className)}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      <span aria-hidden="true">{BRAND.wordmark.active}</span>
      <span aria-hidden="true" className="text-primary">
        {BRAND.wordmark.accent}
      </span>
    </span>
  );
}