"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import type { DashboardCaregiverDTO } from "@/shared/types";

export interface CaregiverStatusProps {
  caregiver: DashboardCaregiverDTO;
}

export function CaregiverStatus({ caregiver }: CaregiverStatusProps) {
  return (
    <section
      data-testid="caregiver-status-widget"
      className="rounded-3xl border border-border/75 bg-card/85 p-6 shadow-card-sm backdrop-blur-md space-y-3.5 transition-all duration-300 hover:shadow-card"
    >
      <div className="flex items-center justify-between">
        <SectionLabel tone="blue" leading={<Users className="size-3.5" />}>
          Caregiver Network
        </SectionLabel>

        {caregiver.newAlerts > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
            {caregiver.newAlerts} alert{caregiver.newAlerts > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Protected
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-heading text-base font-bold text-ink-900 dark:text-ink-100">
          {caregiver.connectedCount === 0
            ? "No Connected Caregivers"
            : `${caregiver.connectedCount} Connected Caregiver${caregiver.connectedCount > 1 ? "s" : ""}`}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {caregiver.connectedCount === 0
            ? "Invite a family member or provider to help monitor your schedule and receive missed dose alerts."
            : "Your caregiver network is actively monitoring adherence and notifications."}
        </p>
      </div>

      <div className="pt-2 flex items-center justify-end border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs text-primary font-medium hover:text-primary-dark"
          nativeButton={false}
          render={<Link href="/caregiver" />}
        >
          <span>Manage Network</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </section>
  );
}
