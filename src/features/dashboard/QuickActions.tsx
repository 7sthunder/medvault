"use client";

import { BarChart3, CalendarDays, Pill, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAppHref } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * §11.4 widget 8 — quick actions: add a medication, open Today's Schedule, review
 * medications, or jump to Reports. Every href resolves through `useAppHref` so the demo
 * workspace keeps its own base path instead of ejecting the visitor into the signed-in app
 * (Phase 19).
 */
export function QuickActions() {
  const router = useRouter();
  const href = useAppHref();
  return (
    <section aria-label="Quick actions">
      <SectionLabel tone="emerald">
        <span>Quick Actions</span>
      </SectionLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={() => router.push(href("/medications/new"))}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add medication
        </Button>
        <Button variant="outline" onClick={() => router.push(href("/schedule"))}>
          <CalendarDays data-icon="inline-start" aria-hidden="true" />
          Today&apos;s schedule
        </Button>
        <Button variant="outline" onClick={() => router.push(href("/medications"))}>
          <Pill data-icon="inline-start" aria-hidden="true" />
          Medications
        </Button>
        <Button variant="outline" onClick={() => router.push(href("/reports"))}>
          <BarChart3 data-icon="inline-start" aria-hidden="true" />
          View reports
        </Button>
      </div>
    </section>
  );
}
