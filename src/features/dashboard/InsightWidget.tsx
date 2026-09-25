"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import type { InsightDTO } from "@/shared/types";

export interface InsightWidgetProps {
  insight: InsightDTO | null;
}

export function InsightWidget({ insight }: InsightWidgetProps) {
  if (!insight) return null;

  return (
    <section
      data-testid="insight-widget"
      className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card/85 to-primary/10 p-6 shadow-card-sm backdrop-blur-md space-y-3.5 transition-all duration-300 hover:shadow-card hover:border-violet-500/50"
    >
      <div className="flex items-center justify-between">
        <SectionLabel tone="violet" leading={<Sparkles className="size-3.5" />}>
          Smart Insight
        </SectionLabel>

        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300">
          <Lightbulb className="size-3" />
          {insight.source === "ai" ? "AI Generated" : "Pattern Analysis"}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="font-heading text-base font-bold text-ink-900 dark:text-ink-100">
          {insight.summary}
        </h3>
        {insight.detail && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insight.detail}
          </p>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-border/50">
        <span className="text-[11px] text-muted-foreground">
          Based on your recent adherence patterns
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium"
          nativeButton={false}
          render={<Link href="/insights" />}
        >
          <span>Explore Insights</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </section>
  );
}
