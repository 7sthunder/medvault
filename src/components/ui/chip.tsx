import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

export type ChipTone =
  | "emerald"
  | "cyan"
  | "magenta"
  | "violet"
  | "blue"
  | "amber"
  | "slate"
  | "neutral"

const CHIP_TONES: Record<ChipTone, string> = {
  emerald: "bg-primary-tint text-primary-dark",
  cyan: "bg-secondary-tint text-cyan-800",
  magenta: "bg-magenta-tint text-pink-600",
  violet: "bg-violet-100 text-violet-600",
  blue: "bg-blue-tint text-blue-600",
  amber: "bg-amber-tint text-amber-600",
  slate: "bg-bg-soft text-ink-500",
  neutral: "border border-border bg-background text-ink-600",
}

export interface ChipProps extends ComponentProps<"span"> {
  tone?: ChipTone
  /**
   * Optional leading glyph (icon name handled by the consumer to keep this
   * primitive ui-free — pass an <Icon /> node instead).
   */
  leading?: ReactNode
}

/**
 * §5.5 chip recipe / §2 dashboard topic chips + HealthBits. Tint bg, full-colour
 * text (contrast-adjusted shade), rounded-full pill. Colour is decoration; pass
 * explicit text/aria when the chip carries semantic weight.
 */
export function Chip({
  tone = "emerald",
  leading,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      data-slot="chip"
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        CHIP_TONES[tone],
        className
      )}
      {...props}
    >
      {leading}
      {children}
    </span>
  )
}