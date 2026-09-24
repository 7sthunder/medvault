import type { LucideIcon } from "lucide-react";
import { Logo, type LogoProps } from "@/components/brand/Logo";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/utils";

export interface BrandProps extends LogoProps {
  /** Show the wordmark next to the tile (default true) */
  showWordmark?: boolean;
  /** Wordmark size in px (§5.1) */
  wordmarkSize?: number;
  /** Visually de-emphasise (nav header vs hero) */
  weight?: "normal" | "strong";
  className?: string;
}

/**
 * §5.1 logo lockup: tile + wordmark on one line. Used by app topbar, marketing nav,
 * auth header. Accepts an optional slot for a trailing element (e.g. the AI chip).
 */
export function Brand({
  size = 36,
  showWordmark = true,
  wordmarkSize,
  href = "/",
  label = "MedVault",
  weight = "strong",
  className,
}: BrandProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={size} href={href} label={label} />
      {showWordmark && (
        <Wordmark
          size={wordmarkSize ?? (weight === "strong" ? 20 : 18)}
          className={cn(weight === "normal" && "text-ink-800 font-bold")}
        />
      )}
    </span>
  );
}

/** Optional trailing chip for the AI assistant brand (§5.1 MedVault AI). */
export function AiBrandLockup({
  Icon,
  title = "MedVault AI",
  href,
  className,
}: {
  Icon: LucideIcon;
  title?: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-white shadow-lg",
        className,
      )}
      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
    >
      <Icon className="size-4" aria-hidden="true" strokeWidth={2.4} />
      <span className="text-sm font-medium tracking-tight">{title}</span>
    </span>
  );
  if (!href) return content;
  return (
    <a href={href} aria-label={title} className="inline-flex">
      {content}
    </a>
  );
}