"use client";

import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TIME_BUCKET_TEXT, type TimeBucket } from "@/shared/enums";
import type { TimeBucketStats } from "@/shared/types";

export interface TimeOfDayPatternProps {
  patterns: TimeBucketStats[];
}

const BUCKET_CONFIG: Record<
  TimeBucket,
  { icon: typeof Sunrise; timeWindow: string }
> = {
  morning: { icon: Sunrise, timeWindow: "12:00 AM – 11:59 AM" },
  afternoon: { icon: Sun, timeWindow: "12:00 PM – 4:59 PM" },
  evening: { icon: Sunset, timeWindow: "5:00 PM – 8:59 PM" },
  night: { icon: Moon, timeWindow: "9:00 PM – 11:59 PM" },
};

export function TimeOfDayPattern({ patterns }: TimeOfDayPatternProps) {
  return (
    <Card className="p-5 space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
          Time of Day Performance
        </h2>
        <p className="text-xs text-muted-foreground">
          Adherence breakdown across daily time intervals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {patterns.map((item) => {
          const cfg = BUCKET_CONFIG[item.bucket];
          const Icon = cfg.icon;
          const rateVal = item.rate !== null ? `${item.rate}%` : "No data";
          const percentNumber = item.rate ?? 0;

          return (
            <div
              key={item.bucket}
              className="flex flex-col justify-between rounded-xl border border-border bg-card-tint p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xs font-bold text-ink-900 dark:text-ink-100">
                      {TIME_BUCKET_TEXT[item.bucket]}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {cfg.timeWindow}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={
                    item.rate !== null && item.rate >= 90
                      ? "border-primary/40 bg-primary-tint text-primary"
                      : item.rate !== null && item.rate >= 70
                        ? "border-amber/40 bg-amber-tint text-amber"
                        : "text-muted-foreground"
                  }
                >
                  {rateVal}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${percentNumber}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{item.taken} taken</span>
                  <span>{item.missed} missed</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
