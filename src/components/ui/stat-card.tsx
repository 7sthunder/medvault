import type { LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "cn"

export type StatTone = "emerald" | "cyan" | "magenta" | "violet" | "blue" | "amber"

const STAT_TONES: Record<StatTone, { tile: string; border: string }> = {
  emerald: {
    tile: "bg-primary-tint text-primary-dark dark:bg-primary/20 dark:text-primary",
    border: "hover:border-primary/40 dark:hover:border-primary/50",
  },
  cyan: {
    tile: "bg-secondary-tint text-cyan-800 dark:bg-secondary/20 dark:text-secondary",
    border: "hover:border-secondary/40 dark:hover:border-secondary/50",
  },
  magenta: {
    tile: "bg-magenta-tint text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    border: "hover:border-pink-500/40 dark:hover:border-pink-500/50",
  },
  violet: {
    tile: "bg-violet-tint text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    border: "hover:border-violet-500/40 dark:hover:border-violet-500/50",
  },
  blue: {
    tile: "bg-blue-tint text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    border: "hover:border-blue-500/40 dark:hover:border-blue-500/50",
  },
  amber: {
    tile: "bg-amber-tint text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    border: "hover:border-amber-500/40 dark:hover:border-amber-500/50",
  },
}

export interface StatCardProps extends ComponentProps<typeof Card> {
  title: string
  value: string
  /** Optional icon shown in an accent tile (top-right) */
  icon?: LucideIcon
  tone?: StatTone
  /** Small context line under the value, e.g. trend "+12% vs last week" */
  subtitle?: ReactNode
  /** Optional footer slot (chips/actions) */
  footer?: ReactNode
}

/**
 * Dashboard stat card — plan §1 dashboard + §2. Tint icon tile, big ink value,
 * muted subtitle; optional `footer` rendered on a divider.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "emerald",
  subtitle,
  footer,
  className,
  ...props
}: StatCardProps) {
  const currentTone = STAT_TONES[tone] || STAT_TONES.emerald

  return (
    <Card
      data-slot="stat-card"
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/75 bg-card/85 backdrop-blur-md transition-all duration-300",
        "shadow-card-sm hover:-translate-y-1 hover:shadow-card-md",
        currentTone.border,
        className
      )}
      {...props}
    >
      {/* Top subtle gradient highlight line on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          tone === "emerald" && "bg-gradient-to-r from-transparent via-primary to-transparent",
          tone === "cyan" && "bg-gradient-to-r from-transparent via-secondary to-transparent",
          tone === "magenta" && "bg-gradient-to-r from-transparent via-pink-400 to-transparent",
          tone === "violet" && "bg-gradient-to-r from-transparent via-violet-400 to-transparent",
          tone === "blue" && "bg-gradient-to-r from-transparent via-blue-400 to-transparent",
          tone === "amber" && "bg-gradient-to-r from-transparent via-amber-400 to-transparent",
        )}
        aria-hidden="true"
      />
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <CardAction>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                currentTone.tile
              )}
            >
              <Icon className="size-4.5" strokeWidth={2.2} />
            </span>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span className="font-heading text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-100">
          {value}
        </span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}