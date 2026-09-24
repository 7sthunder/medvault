import type { ComponentProps } from "react";
import { statusMeta, type DoseStatus } from "@/shared/status";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends ComponentProps<"span"> {
  status: DoseStatus;
}

/**
 * §12 status chip: pill with tint background + icon + label.
 * Colour is never the only signal — icon + visible text + aria-label always ship.
 */
export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const meta = statusMeta(status);
  return (
    <span
      role="img"
      aria-label={meta.aria}
      data-status={status}
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.bg,
        meta.fg,
        className,
      )}
      {...props}
    >
      {meta.ping ? (
        <span className="relative flex size-2" aria-hidden="true">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              meta.ping,
            )}
          />
          <span className={cn("relative inline-flex size-2 rounded-full", meta.ping)} />
        </span>
      ) : (
        <meta.Icon className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={2.5} />
      )}
      <span aria-hidden="true">{meta.label}</span>
    </span>
  );
}