"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Users } from "lucide-react";

import { SectionLabel } from "@/components/ui/section-label";
import { useAppHref } from "@/components/layout/shell-context";
import type { DashboardCaregiverDTO } from "@/shared/types";

/**
 * §11.4 widget 7 — caregiver status. Filled in Phase 17: connection + open-alert counts with
 * a link into the real `/caregiver` workspace (invite, permissions, alert history). Read-only
 * summary — every mutation happens on the caregiver page behind the server-side boundary.
 */
export function CaregiverStatus({ caregiver }: { caregiver: DashboardCaregiverDTO }) {
  const href = useAppHref();
  return (
    <section aria-label="Caregiver status">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel tone="blue">
          <span>Caregivers</span>
        </SectionLabel>
        <Link
          href={href("/caregiver")}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark hover:underline"
        >
          Manage
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card-sm">
          <Users className="size-4.5 text-blue-600" aria-hidden="true" />
          <div>
            <p className="font-heading text-xl font-bold text-ink-900">
              {caregiver.connectedCount}
            </p>
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
      {caregiver.connectedCount === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          No one is caring for you yet — invite a family member or friend to share your routine.
        </p>
      )}
    </section>
  );
}
