"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SectionLabel } from "@/components/ui/section-label";
import { formatInstant } from "@/lib/format";
import type { InsightDTO } from "@/shared/types";

import { categoryTone, sourceLabel } from "@/features/insights/meta";

/**
 * §11.4 widget 6 — latest AI insight card. Filled in Phase 17: shows the newest persisted
 * row with its category + source tag (AI vs "generated from your data") and links into the
 * full `/insights` stack. Plain text only — the AI text is never rendered as HTML/markdown.
 */
export function InsightWidget({ insight, timeZone }: { insight: InsightDTO | null; timeZone: string }) {
  return (
    <section aria-label="AI insight summary">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel tone="magenta">
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>AI Insight</span>
        </SectionLabel>
        {insight && (
          <Link
            href="/insights"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark hover:underline"
          >
            All insights
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {insight ? (
        <Card className="mt-2 bg-magenta-tint/40 shadow-card-sm">
          <CardContent className="px-4 py-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip tone={categoryTone(insight.category)}>{insight.category.replace(/_/g, " ")}</Chip>
              <Chip tone={insight.source === "ai" ? "violet" : "slate"}>{sourceLabel(insight.source)}</Chip>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink-900">{insight.summary}</p>
            {insight.detail && <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>}
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Generated {formatInstant(insight.createdAt, timeZone)}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="mt-2 rounded-xl border border-dashed border-border bg-card/60 px-4 py-4 text-sm text-muted-foreground">
          No insights yet — once you&apos;ve logged a few days, MedVault will surface patterns here. Generate them
          any time from the{" "}
          <Link className="font-semibold text-primary hover:underline" href="/insights">
            insights page
          </Link>
          .
        </p>
      )}
    </section>
  );
}