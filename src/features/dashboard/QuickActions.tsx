"use client";

import { CalendarDays, Plus, Pill } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * §11.4 widget 8 — quick actions: add a medication, open Today's Schedule, or the
 * medication list. Each is a real route (no dead links).
 */
export function QuickActions() {
  const router = useRouter();
  return (
    <section aria-label="Quick actions">
      <SectionLabel tone="emerald">
        <span>Quick Actions</span>
      </SectionLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={() => router.push("/medications/new")}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add medication
        </Button>
        <Button variant="outline" onClick={() => router.push("/schedule")}>
          <CalendarDays data-icon="inline-start" aria-hidden="true" />
          Today&apos;s schedule
        </Button>
        <Button variant="outline" onClick={() => router.push("/medications")}>
          <Pill data-icon="inline-start" aria-hidden="true" />
          Medications
        </Button>
      </div>
    </section>
  );
}