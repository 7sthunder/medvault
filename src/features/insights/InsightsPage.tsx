"use client";

import { AlertCircle, Info, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { InsightCard } from "./InsightCard";
import { RegenerateButton } from "./RegenerateButton";

export function InsightsPage() {
  const {
    data: insights,
    isLoading,
    isError,
    error,
    refetch,
  } = api.insights.list.useQuery();

  return (
    <div data-testid="insights-page" className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header with Title and Regenerate Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="size-7 text-violet-500" />
            AI Health Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized behavioral analysis based on your schedule timing and adherence patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RegenerateButton />
        </div>
      </div>

      {/* Non-diagnostic Safety Disclaimer Banner */}
      <div
        data-testid="insights-disclaimer"
        className="rounded-xl border border-violet-500/20 bg-violet-500/5 dark:bg-violet-950/20 p-4 flex items-start gap-3 text-xs text-muted-foreground leading-relaxed"
      >
        <Info className="size-4 shrink-0 text-violet-600 dark:text-violet-400 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Behavioral Guidance Only: </span>
          MedVault AI analyzes timing consistency, reminder preferences, and habit streaks. These insights are strictly non-diagnostic and non-prescriptive. Always consult your prescribing physician or pharmacist before modifying any medication schedule or dosage.
        </div>
      </div>

      {/* Main Content Areas */}
      {isLoading && (
        <div
          data-testid="insights-loading-skeleton"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-xs"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <div className="pt-2 border-t border-border/50 flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <h3 className="font-heading font-semibold text-foreground">
            Unable to load adherence insights
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {error?.message || "An unexpected error occurred while fetching your habit insights."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-1.5 mt-2"
          >
            <RefreshCw className="size-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {!isLoading && !isError && insights && insights.length === 0 && (
        <div
          data-testid="insights-empty-state"
          className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-4 max-w-lg mx-auto"
        >
          <div className="inline-flex p-3 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Sparkles className="size-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading text-lg font-semibold text-foreground">
              No Insights Generated Yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Log your scheduled doses and build your routine. MedVault will analyze your adherence trends to uncover actionable behavioral tips.
            </p>
          </div>
          <RegenerateButton size="default" className="mt-2" />
        </div>
      )}

      {!isLoading && !isError && insights && insights.length > 0 && (
        <div data-testid="insights-grid" className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
