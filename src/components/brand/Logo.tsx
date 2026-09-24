import { HeartPulse } from "lucide-react";
import { LOGO } from "@/shared/brand";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /** Tile size in px (36–44 per §5.1) */
  size?: number;
  className?: string;
  /** Allow the tile to be interactive (default true → renders as a link to /) */
  href?: string | null;
  /** Value for aria-label; defaults to BRAND.name */
  label?: string;
}

/**
 * §5.1 brand tile — emerald→cyan gradient, white HeartPulse, leaf shadow.
 * Sized via inline styles (gradient/size/radius are brand constants, not tokens).
 */
export function Logo({ size = 40, className, href = "/", label = "MedVault" }: LogoProps) {
  const tile = (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex shrink-0 items-center justify-center font-sans", className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(10, Math.round(size * 0.27)),
        background: LOGO.gradient,
        boxShadow: LOGO.shadow,
      }}
    >
      <HeartPulse
        className="text-white"
        style={{ width: Math.round(size * 0.6), height: Math.round(size * 0.6) }}
        strokeWidth={2.4}
        aria-hidden="true"
      />
    </span>
  );

  if (href === null) return tile;

  return (
    <a href={href} aria-label={label} className="inline-flex whitespace-nowrap outline-ring/50">
      {tile}
    </a>
  );
}