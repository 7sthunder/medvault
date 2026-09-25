"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { SkipDialog } from "@/features/schedule/SkipDialog";
import { SnoozeDialog } from "@/features/schedule/SnoozeDialog";
import { api } from "@/lib/trpc";
import type { DoseEventDTO } from "@/shared/types";
import { motion, type Variants } from "framer-motion";
import { AppointmentsWidget } from "@/features/appointments/AppointmentsWidget";
import { useI18n } from "@/lib/i18n/context";
import { AdherenceWidget } from "./AdherenceWidget";
import { CaregiverStatus } from "./CaregiverStatus";
import { InsightWidget } from "./InsightWidget";
import { MedSummary } from "./MedSummary";
import { NextDoseHero } from "./NextDoseHero";
import { QuickActions } from "./QuickActions";
import { TodayFeed } from "./TodayFeed";

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

export function DashboardPage() {
  const { t } = useI18n();
  const [snoozeDose, setSnoozeDose] = useState<DoseEventDTO | null>(null);
  const [skipDose, setSkipDose] = useState<DoseEventDTO | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data, isLoading, isError, error, refetch } = api.dashboard.get.useQuery();

  const takeMutation = api.dose.take.useMutation({
    onSuccess: (updated) => {
      toast.success(`${updated.medication.name} marked as taken!`);
      void utils.dashboard.get.invalidate();
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
      void utils.dashboard.get.invalidate();
      void utils.dose.today.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Could not snooze dose.");
    },
  });

  const skipMutation = api.dose.skip.useMutation({
    onSuccess: (updated) => {
      toast(`${updated.medication.name} skipped.`);
      void utils.dashboard.get.invalidate();
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

  // 1. Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-8" data-testid="dashboard-loading-skeleton">
        {/* Hero skeleton */}
        <Skeleton className="h-44 w-full rounded-3xl" />

        {/* 4 StatCards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>

        {/* Main 2-column layout skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError || !data) {
    return (
      <div className="py-12" data-testid="dashboard-error-state">
        <ErrorState
          title="Could not load your dashboard"
          description={error?.message || "An unexpected error occurred while fetching your dashboard data."}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  const { stats, nextDose, dueNow, today, week, medications, latestInsight, caregiver } = data;
  const hasMedications = medications.length > 0;

  return (
    <motion.div
      className="space-y-8"
      data-testid="dashboard-content"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Hero Action Block */}
      <motion.div variants={itemVariants}>
        <NextDoseHero
          nextDose={nextDose}
          dueNow={dueNow}
          hasMedications={hasMedications}
          onTake={handleTake}
          onOpenSnooze={(dose) => setSnoozeDose(dose)}
          onOpenSkip={(dose) => setSkipDose(dose)}
          takingId={takingId}
        />
      </motion.div>

      {/* 2. Stat Rail */}
      <motion.section variants={itemVariants} aria-label="Key adherence and medication metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("dashboard.todayAdherence", "Today's Adherence")}
            value={stats.adherenceToday !== null ? `${stats.adherenceToday}%` : t("dashboard.noDosesYet", "No doses yet")}
            icon={ShieldCheck}
            tone="emerald"
            subtitle={`${stats.takenToday} ${t("dashboard.of", "of")} ${stats.scheduledToday} ${t("dashboard.dosesTakenSuffix", "doses taken")}`}
          />
          <StatCard
            title={t("dashboard.currentStreak", "Current Streak")}
            value={`${stats.currentStreak} ${stats.currentStreak === 1 ? t("dashboard.day", "Day") : t("dashboard.days", "Days")}`}
            icon={Flame}
            tone="amber"
            subtitle={stats.currentStreak >= 7 ? t("dashboard.outstandingConsistency", "Outstanding consistency!") : t("dashboard.keepTaking", "Keep taking doses on time")}
          />
          <StatCard
            title={t("dashboard.nextScheduledDose", "Next Scheduled Dose")}
            value={
              stats.nextDoseTime
                ? format(new Date(stats.nextDoseTime), "h:mm a")
                : t("dashboard.allDone", "All done")
            }
            icon={CalendarClock}
            tone="cyan"
            subtitle={nextDose ? nextDose.medication.name : t("dashboard.noMoreDosesToday", "No more doses today")}
          />
          <StatCard
            title={t("dashboard.missedToday", "Missed Today")}
            value={`${stats.missedToday}`}
            icon={AlertTriangle}
            tone={stats.missedToday > 0 ? "magenta" : "emerald"}
            subtitle={stats.missedToday === 0 ? t("dashboard.zeroMissed", "Zero missed doses") : t("dashboard.dosesNeedReview", "Doses need review")}
          />
        </div>
      </motion.section>

      {/* 3. Main Dashboard Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Feed & 7-Day Trend Chart */}
        <div className="lg:col-span-2 space-y-6">
          <TodayFeed
            today={today}
            onTake={handleTake}
            onOpenSnooze={(dose) => setSnoozeDose(dose)}
            onOpenSkip={(dose) => setSkipDose(dose)}
            takingId={takingId}
          />

          <AdherenceWidget week={week} />
        </div>

        {/* Right Column: Medications, Insights, Caregiver */}
        <div className="space-y-6">
          <MedSummary medications={medications} />
          <AppointmentsWidget />
          <InsightWidget insight={latestInsight} />
          <CaregiverStatus caregiver={caregiver} />
        </div>
      </motion.div>

      {/* 4. Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Dialogs */}
      <SnoozeDialog
        open={Boolean(snoozeDose)}
        onOpenChange={(open) => {
          if (!open) setSnoozeDose(null);
        }}
        dose={snoozeDose}
        onConfirm={handleSnooze}
        isSubmitting={snoozeMutation.isPending}
      />

      <SkipDialog
        open={Boolean(skipDose)}
        onOpenChange={(open) => {
          if (!open) setSkipDose(null);
        }}
        dose={skipDose}
        onConfirm={handleSkip}
        isSubmitting={skipMutation.isPending}
      />
    </motion.div>
  );
}
