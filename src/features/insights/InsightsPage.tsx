"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import type { InsightSource } from "@/shared/enums";
import type { InsightDTO } from "@/shared/types";

import { InsightCard } from "./InsightCard";
import { RegenerateButton } from "./RegenerateButton";

interface GeneratedBatch {
  items: InsightDTO[];
  source: InsightSource;
  empty: boolean;
}

/**
 * Phase 17 — §11.9 `/insights`. Lists the persisted insight stack (newest first) with an
 * inline "Regenerate" that re-runs one full generation pass (AI → validated → fallback) and
 * swaps in the fresh batch. Empty data shows the "prerequisites" state instead of fabricating
 * anything; AI failures degrade to the deterministic fallback (flagged on the cards).
 */
export function InsightsPage() {
  const { user } = useShell();
  const [generated, setGenerated] = useState<GeneratedBatch | null>(null);

  const list = api.insights.list.useQuery(undefined, { staleTime: 30_000 });
  const regenerate = api.insights.regenerate.useMutation({
    onSuccess: (result) => setGenerated(result),
  });

  const persisted = list.data ?? [];
  const fresh = generated && generated.items.length > 0 ? generated.items : null;
  const visible = fresh ?? persisted;
  const hasAny = visible.length > 0;

  if (list.isLoading) return <InsightsSkeleton />;

  return (
    <main className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel tone="magenta">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI Insights
          </SectionLabel>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-ink-900">Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Patterns in your routine, plain-spoken. Source: your last 30 days of doses.
          </p>
        </div>
        <RegenerateButton
          generating={regenerate.isPending}
          onRegenerate={() => regenerate.mutate({ timeZone: user.timezone })}
        />
      </header>

      <div className="mt-8 flex flex-col gap-4">
        {list.isError ? (
          <EmptyState
            icon={Sparkles}
            title="Couldn't load insights"
            description="Something went wrong while loading your insight feed."
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                Try again
              </Button>
            }
          />
        ) : !hasAny ? (
          <InsightsPrereq />
        ) : (
          <>
            <RegenerateNotice
              fresh={fresh}
              source={generated?.source ?? null}
              allFallback={persisted.length > 0 && persisted.every((i) => i.source !== "ai")}
            />
            <ol className="flex flex-col gap-4">
              {visible.map((item) => (
                <li key={item.id}>
                  <InsightCard insight={item} />
                </li>
              ))}
            </ol>
            {generated && generated.items.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing the freshest batch. Older rows are still kept in your feed.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/** §11.9 prereq empty state — never fabricate an insight when there is no data. */
function InsightsPrereq() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Not enough data yet"
      description="Insights are built from your last 30 days. Add medications, take a few doses, then generate — MedVault will spot patterns for you."
    />
  );
}

function RegenerateNotice({
  fresh,
  source,
  allFallback,
}: {
  fresh: GeneratedBatch | null;
  source: InsightSource | null;
  allFallback: boolean;
}) {
  if (fresh && source === "ai") {
    return (
      <p className="rounded-lg bg-primary-tint px-3 py-2 text-sm text-primary-dark">
        <Sparkles className="mr-1.5 inline size-3.5" aria-hidden="true" />
        Generated fresh insights.
      </p>
    );
  }
  if (allFallback) {
    return (
      <p className="rounded-lg bg-violet-100 px-3 py-2 text-sm text-violet-600">
        AI is unavailable — these insights were generated from your data instead.
      </p>
    );
  }
  return null;
}

function InsightsSkeleton() {
  return (
    <main className="mx-auto max-w-3xl">
      <Skeleton className="h-7 w-40 rounded-md" />
      <Skeleton className="mt-2 h-16 w-64 rounded-lg" />
      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </main>
  );
}