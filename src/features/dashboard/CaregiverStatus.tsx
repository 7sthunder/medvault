"use client";

import { BellRing, Users } from "lucide-react";

import { SectionLabel } from "@/components/ui/section-label";
import type { DashboardCaregiverDTO } from "@/shared/types";

/**
 * §11.4 widget 7 — caregiver status (stub this phase; full caregiver workspace +
 * `/caregiver` lands in Phase 17). Shows connection + alert counts only.
 */
export function CaregiverStatus({ caregiver }: { caregiver: DashboardCaregiverDTO }) {
  return (
    <section aria-label="Caregiver status">
      <SectionLabel tone="blue">
        <span>Caregivers</span>
      </SectionLabel>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card-sm">
          <Users className="size-4.5 text-blue-600" aria-hidden="true" />
          <div>
            <p className="font-heading text-xl font-bold text-ink-900">{caregiver.connectedCount}</p>
            <p className="text-xs text-muted-foreground">Connected</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card-sm">
          <BellRing className="size-4.5 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-heading text-xl font-bold text-ink-900">{caregiver.newAlerts}</p>
            <p className="text-xs text-muted-foreground">New alerts</p>
          </div>
        </div>
      </div>
    </section>
  );
}