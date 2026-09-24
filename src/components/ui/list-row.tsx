import type { LucideIcon } from "lucide-react"
import type { ComponentProps, KeyboardEvent, ReactNode } from "react"
import { cn } from "cn"

export interface ListRowProps extends Omit<ComponentProps<"div">, "title"> {
  /** Leading accent tile icon (e.g. Pill for medications) */
  icon?: LucideIcon
  /** Tile styling — tint pair like `bg-primary-tint text-primary-dark` */
  iconClass?: string
  title: ReactNode
  subtitle?: ReactNode
  /** Trailing slot: status badge, chevron, time… */
  right?: ReactNode
  /** When set the row behaves like a button (role, tabIndex, keys, hover) */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

/**
 * §2/§4 list row — icon tile + title + optional subtitle + trailing slot.
 * The backbone of medication lists, dashboard "Today" and history rows.
 */
export function ListRow({
  icon: Icon,
  iconClass = "bg-primary-tint text-primary-dark",
  title,
  subtitle,
  right,
  onClick,
  className,
  ...props
}: ListRowProps) {
  const interactive = Boolean(onClick)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (interactive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
    }
    props.onKeyDown?.(e)
  }

  return (
    <div
      data-slot="list-row"
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left",
        interactive &&
          "cursor-pointer transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-4 focus-visible:ring-primary-ring",
        className
      )}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : props.onKeyDown}
      {...(interactive ? {} : { onKeyDown: undefined })}
      {...props}
    >
      {Icon && (
        <span
          aria-hidden="true"
          data-slot="list-row-icon"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconClass
          )}
        >
          <Icon className="size-5" strokeWidth={2.2} />
        </span>
      )}
      <span className="grid min-w-0 flex-1 items-center gap-0.5" data-slot="list-row-body">
        <span className="truncate text-sm font-semibold text-ink-900">{title}</span>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
      {right && (
        <span data-slot="list-row-right" className="flex shrink-0 items-center gap-2">
          {right}
        </span>
      )}
    </div>
  )
}