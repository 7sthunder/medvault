"use client";

import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import type { TimeBucket } from "@/shared/enums";
import type { DoseEventDTO } from "@/shared/types";
import { DoseCard } from "./DoseCard";

export interface TimeBucketSectionProps {
  bucket: TimeBucket;
  doses: DoseEventDTO[];
  onTake: (doseId: string) => Promise<void>;
  onOpenSnooze: (dose: DoseEventDTO) => void;
  onOpenSkip: (dose: DoseEventDTO) => void;
  isTakingId: string | null;
}

const BUCKET_META: Record<
  TimeBucket,
  { title: string; subtitle: string; Icon: typeof Sunrise; tileClass: string }
> = {
  morning: {
    title: "Morning",
    subtitle: "6:00 AM – 12:00 PM",
    Icon: Sunrise,
    tileClass: "bg-amber-tint text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  afternoon: {
    title: "Afternoon",
    subtitle: "12:00 PM – 5:00 PM",
    Icon: Sun,
    tileClass: "bg-blue-tint text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  evening: {
    title: "Evening",
    subtitle: "5:00 PM – 9:00 PM",
    Icon: Sunset,
    tileClass: "bg-violet-tint text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
  night: {
    title: "Night",
    subtitle: "9:00 PM – 6:00 AM",
    Icon: Moon,
    tileClass: "bg-secondary-tint text-secondary dark:bg-secondary/20 dark:text-secondary",
  },
};

export function TimeBucketSection({
  bucket,
  doses,
  onTake,
  onOpenSnooze,
  onOpenSkip,
  isTakingId,
}: TimeBucketSectionProps) {
  if (doses.length === 0) return null;

  const { title, subtitle, Icon, tileClass } = BUCKET_META[bucket];

  return (
    <section className="space-y-3" aria-labelledby={`bucket-title-${bucket}`}>
      <div className="flex items-center gap-2.5 border-b border-border/70 pb-2.5">
        <div className={`flex size-8 items-center justify-center rounded-xl shadow-xs ${tileClass}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <h2
            id={`bucket-title-${bucket}`}
            className="font-heading text-sm font-bold text-ink-900 dark:text-ink-100"
          >
            {title}
          </h2>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <span className="ml-auto inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground font-semibold">
          {doses.length} {doses.length === 1 ? "dose" : "doses"}
        </span>
      </div>

      <div className="grid gap-2.5">
        {doses.map((dose) => (
          <DoseCard
            key={dose.id}
            dose={dose}
            onTake={onTake}
            onOpenSnooze={onOpenSnooze}
            onOpenSkip={onOpenSkip}
            isTaking={isTakingId === dose.id}
          />
        ))}
      </div>
    </section>
  );
}
