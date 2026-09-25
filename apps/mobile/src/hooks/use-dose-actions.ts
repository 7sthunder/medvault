import { useCallback, useMemo } from "react";
import { localDateKey } from "@shared/times";
import type { MedicationStatus } from "@shared/enums";
import type { DoseEventDTO, UserProfileDTO } from "@shared/types";

import { api, trpcHeaders } from "@/lib/trpc";

/**
 * Dose-action mutations shared by every surface that can resolve a dose.
 *
 * Ported from the web `useDoseActions`. The invalidation set is the important part: a
 * dose action changes the schedule day, the dose detail, the dashboard widgets and the
 * derived adherence numbers all at once, so all four are invalidated together. Missing
 * one is how you get a "92% today" badge that disagrees with the list under it.
 */
export function useDoseActions(timezone: string) {
  const utils = api.useUtils();

  const invalidateDoseViews = useCallback(() => {
    const today = localDateKey(new Date(), timezone);
    void utils.schedule.day.invalidate({ date: today });
    void utils.schedule.get.invalidate();
    void utils.adherence.summary.invalidate();
    void utils.dashboard.get.invalidate();
    void utils.medication.list.invalidate();
  }, [utils, timezone]);

  const take = api.dose.take.useMutation({ onSuccess: invalidateDoseViews });
  const snooze = api.dose.snooze.useMutation({ onSuccess: invalidateDoseViews });
  const skip = api.dose.skip.useMutation({ onSuccess: invalidateDoseViews });

  return useMemo(
    () => ({
      take: (doseId: string) => take.mutateAsync({ doseId, action: "take" as const }),
      snooze: (doseId: string) => snooze.mutateAsync({ doseId, action: "snooze" as const }),
      skip: (doseId: string, skipReason?: string) =>
        skip.mutateAsync({ doseId, skipReason, action: "skip" as const }),
      isPending: take.isPending || snooze.isPending || skip.isPending,
      error: take.error ?? snooze.error ?? skip.error,
    }),
    [take, snooze, skip],
  );
}

/**
 * Medication status per medication id, for the `medStatus` gate the dose cards use.
 *
 * The dose payload carries a `medication` snapshot but not its status, and a paused
 * medication must not offer Take/Snooze/Skip — so screens that render dose cards resolve
 * the status map once and pass it down.
 */
export function useMedicationStatuses(): {
  statusOf: (medicationId: string) => MedicationStatus;
  isLoading: boolean;
} {
  const { data, isLoading } = api.medication.list.useQuery(undefined, {
    // Statuses change rarely and the dose view already re-renders around them.
    staleTime: 30_000,
  });

  const map = useMemo(() => {
    const entries: Record<string, MedicationStatus> = {};
    for (const med of data?.medications ?? []) entries[med.id] = med.status;
    return entries;
  }, [data]);

  return {
    statusOf: (medicationId: string) => map[medicationId] ?? "active",
    isLoading,
  };
}

/** Convenience: a resolved dose's medication status, defaulting to active. */
export function resolveMedStatus(
  dose: DoseEventDTO,
  statuses: Record<string, MedicationStatus>,
): MedicationStatus {
  return statuses[dose.medicationId] ?? "active";
}

export type { UserProfileDTO };
export { trpcHeaders };
