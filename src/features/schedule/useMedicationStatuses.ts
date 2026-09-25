"use client";

import { useMemo } from "react";

import { api } from "@/lib/trpc";

export type MedStatusMap = Record<string, "active" | "paused">;

/**
 * Medication `id → status` map for the schedule feed. Read-only usage of the
 * Phase 10 `medication.list` service — the create/edit UI owns this router.
 */
export function useMedicationStatuses(): MedStatusMap {
  const { data } = api.medication.list.useQuery(undefined, {
    staleTime: 60_000,
  });
  return useMemo(() => {
    const map: MedStatusMap = {};
    for (const med of data?.medications ?? []) map[med.id] = med.status;
    for (const med of data?.archived ?? []) map[med.id] = "paused";
    return map;
  }, [data]);
}