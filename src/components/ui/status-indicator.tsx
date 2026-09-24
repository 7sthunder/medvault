import type { ComponentProps } from "react";
import { statusMeta, type DoseStatus } from "@/shared/status";
import { cn } from "@/lib/utils";

export interface StatusIndicatorProps extends ComponentProps<"span"> {
  status: DoseStatus;
}

/**
 * §12 compact status indicator: icon-or-pulse + text label, tinted but NEVER colour-only.
 * Exposes `aria-label` (e.g. "Dose taken") for screen readers.
 */
export function StatusIndicator({ status, className, ...props }: StatusIndicatorProps) {
  const meta = statusMeta(status);
  return (
    <span
      role="img"
      aria-label={meta.aria}
      data-status={status}
      data-slot="status-indicator"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold",
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