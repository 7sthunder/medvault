import type { ComponentProps, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

export interface EmptyStateProps extends ComponentProps<"div"> {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  /** Optional action (usually a Button) */
  action?: ReactNode
  /** Compact variant for inline/panel empties (smaller tile + text) */
  compact?: boolean
}

/**
 * §2 empty state — tint icon bubble + title + description + optional action.
 * Colour is decoration: title carries the message.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "gap-1.5 p-4" : "gap-3 p-8",
        className
      )}
      {...props}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center rounded-2xl bg-primary-tint text-primary-dark",
            compact ? "size-10" : "size-14"
          )}
        >
          <Icon className={compact ? "size-5" : "size-7"} strokeWidth={2.2} />
        </span>
      )}
      <div className="grid gap-1">
        <p className={cn("font-heading font-semibold text-ink-900", compact ? "text-sm" : "text-base")}>
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}