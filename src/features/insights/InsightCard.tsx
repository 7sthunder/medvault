"use client";

import { FileText, Sparkles } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import type { InsightDTO } from "@/shared/types";

import { categoryTone, sourceLabel, suggestedActionLabel } from "./meta";

/**
 * §11.9/§10.10 insight card — renders one persisted `InsightDTO`: category chip, suggested
 * action chip, summary + detail, and a source tag ("AI insight" vs "Generated from your data"
 * for fallback rows). The persisted rows are pre-validated, so nothing here re-introduces an
 * LLM — the AI text is plain text and rendered as such (never raw HTML/markdown).
 */
export function InsightCard({ insight }: { insight: InsightDTO }) {
  return (
    <article
      data-slot="insight-card"
      data-source={insight.source}
      className="rounded-xl border border-border bg-card p-4 shadow-card-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <Chip tone={categoryTone(insight.category)}>{insight.category.replace(/_/g, " ")}</Chip>
        {insight.suggestedActionType && (
          <Chip tone="neutral" leading={<FileText className="size-3" aria-hidden="true" />}>
            {suggestedActionLabel(insight.suggestedActionType)}
          </Chip>
        )}
      </header>
      <p className="mt-3 font-heading text-base font-bold text-ink-900">{insight.summary}</p>
      {insight.detail && <p className="mt-1.5 text-sm text-muted-foreground">{insight.detail}</p>}
      <footer className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3" aria-hidden="true" />
          {sourceLabel(insight.source)}
        </span>
        {insight.confidence != null && (
          <span>{Math.round(insight.confidence * 100)}% confidence</span>
        )}
      </footer>
    </article>
  );
}
