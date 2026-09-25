import { DOSE_STATUSES } from "@shared/enums";
import type { DoseStatus } from "@shared/enums";
import { DOSE_STATUS_DISPLAY } from "@shared/status-meta";
import type { StatusTone } from "@shared/status-meta";

import { DOSE_STATUS_ICONS } from "@/lib/icons";
import type { IoniconName } from "@/lib/icons";

/**
 * Dose-status presentation for React Native.
 *
 * Reads labels/tones/hexes from the shared `DOSE_STATUS_DISPLAY` table — the same data the
 * web chip uses — and adds the two things a native chip needs that CSS cannot express: an
 * icon *name* (the web table holds a lucide component) and a resolved background that
 * works without a stylesheet.
 *
 * Note the import is `@shared/status-meta`, not `@shared/status`: the latter value-imports
 * `lucide-react`, which Metro would happily pull into the native bundle even though this
 * app never renders one.
 */
export type { StatusTone };

export interface DoseStatusView {
  label: string;
  /** Accessibility string, e.g. "Dose taken". */
  aria: string;
  tone: StatusTone;
  icon: IoniconName;
  /** Foreground / chip background. */
  fg: string;
  bg: string;
  /** Hex only — needed where a raw colour is unavoidable (SVG charts). */
  fgHex: string;
  bgHex: string;
  /** Non-null for `due-now`; drives the pulsing dot on the dose hero. */
  pulseHex: string | null;
}

export const DOSE_STATUS_VIEW: Readonly<Record<DoseStatus, DoseStatusView>> = Object.fromEntries(
  DOSE_STATUSES.map((status) => {
    const meta = DOSE_STATUS_DISPLAY[status];
    return [
      status,
      {
        label: meta.label,
        aria: meta.aria,
        tone: meta.tone,
        icon: DOSE_STATUS_ICONS[status],
        fg: meta.fgHex,
        bg: meta.bgHex,
        fgHex: meta.fgHex,
        bgHex: meta.bgHex,
        pulseHex: meta.pulseHex,
      },
    ];
  }),
) as Record<DoseStatus, DoseStatusView>;

export function isDoseStatus(value: string): value is DoseStatus {
  return (DOSE_STATUSES as readonly string[]).includes(value);
}

export function statusView(status: DoseStatus): DoseStatusView {
  return DOSE_STATUS_VIEW[status];
}

/**
 * Tone → flat colour pair, for places that show a tone without a dose status
 * (adherence thresholds, notification kinds).
 */
export const TONE_COLORS: Readonly<Record<StatusTone, { fg: string; bg: string }>> = {
  emerald: { fg: "#059669", bg: "#d1fae5" },
  blue: { fg: "#3b82f6", bg: "#dbeafe" },
  red: { fg: "#ef4444", bg: "#fee2e2" },
  amber: { fg: "#f59e0b", bg: "#fef3c7" },
  slate: { fg: "#64748b", bg: "#f1f5f9" },
  neutral: { fg: "#64748b", bg: "#e2e8f0" },
};
