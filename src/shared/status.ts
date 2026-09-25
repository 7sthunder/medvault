import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  AlertCircle,
  Ban,
  BellRing,
  CheckCircle2,
  Clock,
  MinusCircle,
  PauseCircle,
} from "lucide-react";

import { DOSE_STATUSES } from "./enums";
import type { DoseStatus } from "./enums";
import { DOSE_STATUS_DISPLAY, isDoseStatus } from "./status-meta";
import type { StatusDisplayMeta, StatusTone } from "./status-meta";

export { DOSE_STATUSES, isDoseStatus };
export type { DoseStatus, StatusTone };

/**
 * Medication dose statuses for the app shell + history (plan §12).
 *
 * The display union itself lives in `shared/enums.ts` (Phase 07 single source) and the
 * label/tone/colour data lives in `shared/status-meta.ts`. This module only adds the one
 * thing those cannot hold: the lucide icon component per status.
 *
 * The split exists so non-DOM clients can share the data without the icon dependency —
 * `apps/mobile` renders `DOSE_STATUS_DISPLAY` with Ionicons instead, and would otherwise
 * pull the whole `lucide-react` barrel into a React Native bundle.
 */

export type { StatusDisplayMeta };

export interface StatusMeta extends StatusDisplayMeta {
  /** Icon component (lucide) — icons + text ships with every status */
  Icon: LucideIcon;
}

const ICONS: Readonly<Record<DoseStatus, LucideIcon>> = {
  taken: CheckCircle2,
  upcoming: Clock,
  "due-now": BellRing,
  missed: AlertCircle,
  skipped: MinusCircle,
  snoozed: AlarmClock,
  paused: PauseCircle,
  canceled: Ban,
};

export const DOSE_STATUS_META: Readonly<Record<DoseStatus, StatusMeta>> = Object.fromEntries(
  DOSE_STATUSES.map((status) => [status, { ...DOSE_STATUS_DISPLAY[status], Icon: ICONS[status] }]),
) as Record<DoseStatus, StatusMeta>;

export function statusMeta(status: DoseStatus): StatusMeta {
  return DOSE_STATUS_META[status];
}
