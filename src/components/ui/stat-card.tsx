import type { LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "cn"

export type StatTone = "emerald" | "cyan" | "magenta" | "violet" | "blue" | "amber"

const STAT_TONES: Record<StatTone, string> = {
  emerald: "bg-primary-tint text-primary-dark",
  cyan: "bg-secondary-tint text-cyan-800",
  magenta: "bg-magenta-tint text-pink-600",
  violet: "bg-violet-tint text-violet-600",
  blue: "bg-blue-tint text-blue-600",
  amber: "bg-amber-tint text-amber-600",
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
  return (
    <Card data-slot="stat-card" className={cn("shadow-card-sm", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <CardAction>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 items-center justify-center rounded-xl",
                STAT_TONES[tone]
              )}
            >
              <Icon className="size-4.5" strokeWidth={2.2} />
            </span>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span className="font-heading text-2xl font-bold tracking-tight text-ink-900">
          {value}
        </span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}