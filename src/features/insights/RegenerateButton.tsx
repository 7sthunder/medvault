"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * §11.9 regenerate button — re-runs one full generation pass (AI → validated → fallback)
 * and swaps in the fresh batch. Disabled while a pass is in flight.
 */
export function RegenerateButton({
  generating,
  onRegenerate,
  className,
}: {
  generating: boolean;
  onRegenerate: () => void;
  className?: string;
}) {
  return (
    <Button variant="outline" size="sm" disabled={generating} onClick={onRegenerate} className={className}>
      <RefreshCw className={generating ? "animate-spin" : ""} aria-hidden="true" />
      {generating ? "Generating…" : "Regenerate"}
    </Button>
  );
}