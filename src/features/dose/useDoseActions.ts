"use client";

import { localDateKey } from "@/shared/times";
import { useNow } from "@/components/layout/clock-context";
import { useShell } from "@/components/layout/shell-context";
import { api } from "@/lib/trpc";

/**
 * Dose-action mutations for the schedule feed (§11.7). Each mutation reconciles +
 * applies in one server transaction and is idempotent; success invalidates every
 * view that derives from the schedule so the action is reflected everywhere at once
 * (schedule day, dose detail, dashboard widgets, adherence cache).
 */
export function useDoseActions() {
  const { user } = useShell();
  const now = useNow();
  const utils = api.useUtils();

  const invalidateDoseViews = () => {
    const today = localDateKey(now, user.timezone);
    void utils.schedule.day.invalidate({ date: today });
    void utils.schedule.get.invalidate();
    void utils.adherence.summary.invalidate();
    void utils.dashboard.get.invalidate();
    void utils.medication.list.invalidate();
  };

  const take = api.dose.take.useMutation({ onSuccess: invalidateDoseViews });
  const snooze = api.dose.snooze.useMutation({ onSuccess: invalidateDoseViews });
  const skip = api.dose.skip.useMutation({ onSuccess: invalidateDoseViews });

  return {
    take: (doseId: string) => take.mutateAsync({ doseId, action: "take" }),
    snooze: (doseId: string) => snooze.mutateAsync({ doseId, action: "snooze" }),
    skip: (doseId: string, skipReason?: string) =>
      skip.mutateAsync({ doseId, skipReason, action: "skip" }),
    isPending: take.isPending || snooze.isPending || skip.isPending,
  };
}
