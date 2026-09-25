"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX, Pill } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { bucketOf } from "@/shared/times";
import type { TimeBucket } from "@/shared/enums";
import type { DoseEventDTO } from "@/shared/types";
import { motion, type Variants } from "framer-motion";
import { ScheduleFilterTabs } from "./ScheduleFilterTabs";
import { ScheduleProgressCard } from "./ScheduleProgressCard";
import { SkipDialog } from "./SkipDialog";
import { SnoozeDialog } from "./SnoozeDialog";
import { TimeBucketSection } from "./TimeBucketSection";
import type { ScheduleFilterTab } from "./types";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function ScheduleView() {
  const [activeTab, setActiveTab] = useState<ScheduleFilterTab>("all");
  const [snoozeDose, setSnoozeDose] = useState<DoseEventDTO | null>(null);
  const [skipDose, setSkipDose] = useState<DoseEventDTO | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: doses = [], isLoading, isRefetching, refetch } = api.dose.today.useQuery();

  const takeMutation = api.dose.take.useMutation({
    onSuccess: (updated) => {
      toast.success(`${updated.medication.name} marked as taken!`);
      void utils.dose.today.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Could not log dose.");
    },
    onSettled: () => {
      setTakingId(null);
    },
  });

  const snoozeMutation = api.dose.snooze.useMutation({
    onSuccess: (updated) => {
      toast(`${updated.medication.name} snoozed by 10 minutes.`);
      void utils.dose.today.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Could not snooze dose.");
    },
  });

  const skipMutation = api.dose.skip.useMutation({
    onSuccess: (updated) => {
      toast(`${updated.medication.name} skipped.`);
      void utils.dose.today.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Could not skip dose.");
    },
  });

  const handleTake = async (doseId: string) => {
    setTakingId(doseId);
    await takeMutation.mutateAsync({ doseId });
  };

  const handleSnooze = async (doseId: string) => {
    await snoozeMutation.mutateAsync({ doseId });
  };

  const handleSkip = async (doseId: string, reason?: string) => {
    await skipMutation.mutateAsync({ doseId, reason });
  };

  // Counts for tabs and progress
  const counts = useMemo(() => {
    const total = doses.length;
    let due = 0;
    let taken = 0;
    let missed = 0;

    for (const d of doses) {
      if (d.status === "taken") taken++;
      else if (d.status === "missed" || d.status === "skipped") missed++;
      else due++;
    }

    return { all: total, due, taken, missed };
  }, [doses]);

  // Filter doses by active tab
  const filteredDoses = useMemo(() => {
    if (activeTab === "due") {
      return doses.filter(
        (d) => d.status === "upcoming" || d.status === "due" || d.status === "snoozed",
      );
    }
    if (activeTab === "taken") {
      return doses.filter((d) => d.status === "taken");
    }
    if (activeTab === "missed") {
      return doses.filter((d) => d.status === "missed" || d.status === "skipped");
    }
    return doses;
  }, [doses, activeTab]);

  // Group filtered doses by time bucket
  const bucketedGroups = useMemo(() => {
    const groups: Record<TimeBucket, DoseEventDTO[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    for (const dose of filteredDoses) {
      const hour = new Date(dose.scheduledFor).getHours();
      const bucket = bucketOf(hour);
      groups[bucket].push(dose);
    }

    return groups;
  }, [filteredDoses]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-10 w-80 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Header Card */}
      <motion.div variants={itemVariants}>
        <ScheduleProgressCard
          totalCount={counts.all}
          takenCount={counts.taken}
          onRefresh={() => void refetch()}
          isRefreshing={isRefetching}
        />
      </motion.div>

      {/* When user has no scheduled doses at all today */}
      {doses.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-dashed border-border/80 bg-card/60 p-12 text-center backdrop-blur-md"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-tint text-primary mb-3">
            <CalendarX className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-ink-900 dark:text-ink-100">
            No doses scheduled for today
          </h2>
          <p className="mt-1 max-w-sm mx-auto text-sm text-muted-foreground">
            You don&apos;t have any active medications scheduled for today. Add a medication to begin tracking your schedule.
          </p>
          <div className="mt-5">
            <Button
              className="shadow-primary-btn"
              nativeButton={false}
              render={<Link href="/medications/new" />}
            >
              <Pill className="mr-1.5 size-4" />
              Add Medication
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Filter Tabs */}
          <motion.div variants={itemVariants}>
            <ScheduleFilterTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={counts}
            />
          </motion.div>

          {/* Doses grouped by bucket */}
          {filteredDoses.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-border/70 bg-card/85 p-8 text-center text-sm text-muted-foreground backdrop-blur-md"
            >
              No doses match the &quot;{activeTab}&quot; filter for today.
            </motion.div>
          ) : (
            <div className="space-y-8">
              {(["morning", "afternoon", "evening", "night"] as const).map((bucket) => (
                <motion.div key={bucket} variants={itemVariants}>
                  <TimeBucketSection
                    bucket={bucket}
                    doses={bucketedGroups[bucket]}
                    onTake={handleTake}
                    onOpenSnooze={setSnoozeDose}
                    onOpenSkip={setSkipDose}
                    isTakingId={takingId}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Snooze & Skip Dialogs */}
      <SnoozeDialog
        open={Boolean(snoozeDose)}
        onOpenChange={(open) => !open && setSnoozeDose(null)}
        dose={snoozeDose}
        onConfirm={handleSnooze}
        isSubmitting={snoozeMutation.isPending}
      />

      <SkipDialog
        open={Boolean(skipDose)}
        onOpenChange={(open) => !open && setSkipDose(null)}
        dose={skipDose}
        onConfirm={handleSkip}
        isSubmitting={skipMutation.isPending}
      />
    </motion.div>
  );
}
