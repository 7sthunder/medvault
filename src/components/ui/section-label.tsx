import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

export type SectionLabelTone = "emerald" | "cyan" | "magenta" | "violet" | "blue"

const SECTION_LABEL_TONES: Record<SectionLabelTone, string> = {
  emerald: "text-primary",
  cyan: "text-cyan-700",
  magenta: "text-pink-600",
  violet: "text-violet-600",
  blue: "text-blue-600",
}

export interface SectionLabelProps extends ComponentProps<"p"> {
  tone?: SectionLabelTone
  /**
   * Optional leading glyph (decoration only — screen readers ignore it).
   */
  leading?: ReactNode
}

/**
 * §5.2 "kicker" — 13px/800/0.12em tracking uppercase used above H2s on
 * marketing + section headers in app screens.
 */
export function SectionLabel({
  tone = "emerald",
  leading,
  className,
  children,
  ...props
}: SectionLabelProps) {
  return (
    <p
      data-slot="section-label"
      data-tone={tone}
      className={cn(
        "flex items-center gap-1.5 text-[13px] font-extrabold tracking-[0.12em] uppercase",
        SECTION_LABEL_TONES[tone],
        className
      )}
      {...props}
    >
      {leading && (
        <span aria-hidden="true" className="inline-flex">
          {leading}
        </span>
      )}
      {children}
    </p>
  )
}