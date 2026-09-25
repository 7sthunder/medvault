"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { FilterBar } from "./FilterBar";
import { HistoryTimeline } from "./HistoryTimeline";
import type { HistoryFilterState } from "./types";

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilterState>({
    rangePreset: "all",
    action: "all",
  });

  // Query medications for filter dropdown (including archived ones so history filters work for past meds)
  const { data: medications = [] } = api.medication.list.useQuery({
    includeArchived: true,
  });

  // Query paginated history events
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = api.history.query.useInfiniteQuery(
    {
      from: filters.from,
      to: filters.to,
      medicationId: filters.medicationId,
      action: filters.action,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  // Flatten items across all fetched pages
  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount ?? items.length;

  const handleResetFilters = () => {
    setFilters({
      rangePreset: "all",
      action: "all",
      medicationId: undefined,
      from: undefined,
      to: undefined,
    });
  };

  return (
    <div className="space-y-6" data-testid="history-page">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
              Dose History
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {totalCount} event{totalCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Authoritative audit trail of dose takes, skips, snoozes, and adherence actions.
          </p>
        </div>
      </div>

      {/* Sticky Filter Toolbar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        medications={medications}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-6" data-testid="history-loading-skeleton">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      ) : isError ? (
        <div className="py-12" data-testid="history-error-state">
          <ErrorState
            title="Failed to load dose history"
            description={error?.message || "An unexpected error occurred while loading audit events."}
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Try Again
              </Button>
            }
          />
        </div>
      ) : (
        <HistoryTimeline
          items={items}
          totalCount={totalCount}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={Boolean(isFetchingNextPage)}
          onLoadMore={() => void fetchNextPage()}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
}
