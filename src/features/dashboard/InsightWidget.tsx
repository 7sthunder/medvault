"use client";

import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { formatInstant } from "@/lib/format";
import type { InsightDTO } from "@/shared/types";

/**
 * §11.4 widget 6 — latest AI insight card (stub this phase; the full `/insights`
 * page + generation pipeline land in Phase 17). When nothing is generated yet it
 * renders a quiet "no insights yet" hint instead of dead space.
 */
export function InsightWidget({ insight, timeZone }: { insight: InsightDTO | null; timeZone: string }) {
  return (
    <section aria-label="AI insight summary">
      <SectionLabel tone="magenta">
        <Sparkles className="size-3.5" aria-hidden="true" />
        <span>AI Insight</span>
      </SectionLabel>
      {insight ? (
        <Card className="mt-2 bg-magenta-tint/40 shadow-card-sm">
          <CardContent className="px-4 py-4">
            <p className="text-sm font-semibold text-ink-900">{insight.summary}</p>
            {insight.detail && <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>}
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Generated {formatInstant(insight.createdAt, timeZone)}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="mt-2 rounded-xl border border-dashed border-border bg-card/60 px-4 py-4 text-sm text-muted-foreground">
          No insights yet — once you&apos;ve logged a few days, MedVault will surface patterns here.
        </p>
      )}
    </section>
  );
}