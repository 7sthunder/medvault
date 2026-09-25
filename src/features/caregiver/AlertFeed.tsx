"use client";

import { BellRing, ChevronRight } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import type { ChipTone } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { formatInstant } from "@/lib/format";
import type { AlertStatus, CaregiverAlertType } from "@/shared/enums";
import type { CaregiverAlertDTO } from "@/shared/types";

/** §11.12 alert type label (+ tone) — colour is never the only signal. */
export const ALERT_TYPE_LABEL: Readonly<Record<CaregiverAlertType, string>> = {
  missed_dose: "Missed dose",
  adherence_drop: "Adherence drop",
  insight: "Insight update",
  demo: "Demo",
};

export function alertTypeTone(type: CaregiverAlertType): ChipTone {
  if (type === "missed_dose") return "amber";
  if (type === "adherence_drop") return "magenta";
  if (type === "insight") return "violet";
  return "slate";
}

export function alertStatusTone(status: AlertStatus): ChipTone {
  if (status === "new") return "blue";
  if (status === "acknowledged") return "amber";
  return "emerald";
}

/**
 * §11.12 alert feed — shared by the caregiver's patient view (their patient's alerts) and the
 * patient's own "alerts sent" history. Rows link to `/caregiver/alerts/[id]` via `onOpen`.
 */
export function AlertFeed({
  items,
  timeZone,
  onOpen,
  emptyTitle = "No alerts",
  emptyDescription = "Missed doses and adherence drops for this patient will show up here.",
}: {
  items: CaregiverAlertDTO[];
  timeZone: string;
  onOpen: (alert: CaregiverAlertDTO) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return <EmptyState className="py-6" compact icon={BellRing} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((alert) => (
        <li key={alert.id}>
          <ListRow
            icon={BellRing}
            title={alert.title}
            subtitle={`${alert.body} · ${formatInstant(alert.createdAt, timeZone)}`}
            right={
              <>
                <Chip tone={alertTypeTone(alert.type)}>{ALERT_TYPE_LABEL[alert.type]}</Chip>
                <Chip tone={alertStatusTone(alert.status)}>{alert.status}</Chip>
                <ChevronRight className="size-4 text-ink-400" aria-hidden="true" />
              </>
            }
            onClick={() => onOpen(alert)}
          />
        </li>
      ))}
    </ul>
  );
}