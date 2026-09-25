"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  AlarmClock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDayHeading } from "@/lib/format";
import type { DoseActionType, DoseEventStatus, DoseStatus } from "@/shared/enums";
import type { DoseActionDTO } from "@/shared/types";
import { HistoryRowMenu } from "./HistoryRowMenu";

export interface HistoryTimelineProps {
  items: DoseActionDTO[];
  totalCount: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onResetFilters?: () => void;
}

interface GroupedDay {
  dateKey: string;
  displayHeading: string;
  isToday: boolean;
  isYesterday: boolean;
  actions: DoseActionDTO[];
}

function toDisplayStatus(status: DoseEventStatus): DoseStatus {
  if (status === "due") return "due-now";
  return status;
}

function getActionMeta(actionType: DoseActionType) {
  switch (actionType) {
    case "take":
      return {
        verb: "Took",
        icon: CheckCircle2,
        iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      };
    case "snooze":
      return {
        verb: "Snoozed",
        icon: AlarmClock,
        iconClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      };
    case "skip":
      return {
        verb: "Skipped",
        icon: XCircle,
        iconClass: "bg-muted text-muted-foreground",
      };
    case "missed_auto":
      return {
        verb: "Missed",
        icon: AlertTriangle,
        iconClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      };
    default:
      return {
        verb: "Recorded",
        icon: History,
        iconClass: "bg-primary/10 text-primary",
      };
  }
}

export function HistoryTimeline({
  items,
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onResetFilters,
}: HistoryTimelineProps) {
  // Group actions by calendar date
  const groupedDays = useMemo<GroupedDay[]>(() => {
    const map = new Map<string, DoseActionDTO[]>();
    const now = new Date();
    const todayKey = format(now, "yyyy-MM-dd");
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayKey = format(yesterday, "yyyy-MM-dd");

    for (const item of items) {
      const dateKey = format(new Date(item.occurredAt), "yyyy-MM-dd");
      const list = map.get(dateKey) ?? [];
      list.push(item);
      map.set(dateKey, list);
    }

    const groups: GroupedDay[] = [];
    for (const [dateKey, dayActions] of map.entries()) {
      const isToday = dateKey === todayKey;
      const isYesterday = dateKey === yesterdayKey;

      let displayHeading: string;
      if (isToday) {
        displayHeading = `Today · ${format(new Date(), "MMMM d, yyyy")}`;
      } else if (isYesterday) {
        displayHeading = `Yesterday · ${format(yesterday, "MMMM d, yyyy")}`;
      } else {
        displayHeading = formatDayHeading(dateKey);
      }

      groups.push({
        dateKey,
        displayHeading,
        isToday,
        isYesterday,
        actions: dayActions,
      });
    }

    return groups;
  }, [items]);

  // 1. Empty state
  if (items.length === 0) {
    return (
      <div className="py-12" data-testid="history-empty-state">
        <EmptyState
          icon={History}
          title="No activity recorded"
          description="There are no dose actions matching your selected filters in the audit log."
          action={
            onResetFilters && (
              <Button type="button" variant="outline" size="sm" onClick={onResetFilters}>
                Clear All Filters
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="history-timeline">
      {groupedDays.map((group) => (
        <section key={group.dateKey} className="space-y-3">
          {/* Day Group Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <SectionLabel
                tone={group.isToday ? "emerald" : "blue"}
                leading={<Calendar className="size-3.5" />}
              >
                {group.displayHeading}
              </SectionLabel>
            </div>

            <span className="text-xs font-medium text-muted-foreground">
              {group.actions.length} action{group.actions.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Action ListRows */}
          <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 shadow-xs overflow-hidden">
            {group.actions.map((item) => {
              const metaInfo = getActionMeta(item.action);
              const Icon = metaInfo.icon;
              const isArchivedMed = Boolean(item.medication.archivedAt);
              const isLate =
                item.action === "take" &&
                (item.meta?.wasLate === true ||
                  item.occurredAt.getTime() > item.eventScheduledFor.getTime() + 60 * 60000);

              const timeStr = format(new Date(item.occurredAt), "h:mm a");
              const scheduledStr = format(new Date(item.eventScheduledFor), "h:mm a");

              const skipReason =
                item.meta && typeof item.meta.reason === "string"
                  ? item.meta.reason
                  : null;
              const snoozeMinutes =
                item.meta && typeof item.meta.snoozeMinutes === "number"
                  ? item.meta.snoozeMinutes
                  : null;

              return (
                <ListRow
                  key={item.id}
                  icon={Icon}
                  iconClass={metaInfo.iconClass}
                  className="px-4 py-3.5"
                  title={
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-semibold text-ink-900 dark:text-ink-100">
                        {metaInfo.verb} {item.medication.name}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {item.medication.dosageAmount} {item.medication.dosageUnit}
                      </span>
                      {isArchivedMed && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                          Archived
                        </Badge>
                      )}
                      {isLate && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-600 border-amber-500/30 bg-amber-500/10">
                          Late
                        </Badge>
                      )}
                    </div>
                  }
                  subtitle={
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium text-ink-700 dark:text-ink-300">
                        {timeStr}
                      </span>
                      <span>· Scheduled for {scheduledStr}</span>
                      {skipReason && (
                        <span className="italic text-foreground/80">
                          (Reason: &ldquo;{skipReason}&rdquo;)
                        </span>
                      )}
                      {snoozeMinutes && (
                        <span className="text-amber-600 dark:text-amber-400">
                          (Snoozed for {snoozeMinutes} min)
                        </span>
                      )}
                    </div>
                  }
                  right={
                    <div className="flex items-center gap-2">
                      <StatusBadge status={toDisplayStatus(item.eventStatus)} />
                      <HistoryRowMenu action={item} />
                    </div>
                  }
                />
              );
            })}
          </div>
        </section>
      ))}

      {/* Pagination / Load More */}
      <div className="pt-4 flex flex-col items-center justify-center gap-2">
        {hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="gap-2 min-w-40"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Loading more...</span>
              </>
            ) : (
              <>
                <Clock className="size-4" />
                <span>Load More Entries</span>
              </>
            )}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Showing all {totalCount} events · Beginning of history
          </p>
        )}
      </div>
    </div>
  );
}
