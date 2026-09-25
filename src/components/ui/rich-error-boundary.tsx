"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface RichErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
}

export function RichErrorBoundary({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this section. Your personal data is safe.",
  homeHref = "/dashboard",
  homeLabel = "Return to Dashboard",
}: RichErrorBoundaryProps) {
  const [showDetails, setShowDetails] = useState(false);

  const copyDetails = async () => {
    const errorText = `Error: ${error.message}\nDigest: ${error.digest || "none"}\nStack: ${error.stack || "none"}`;
    try {
      await navigator.clipboard.writeText(errorText);
      toast.success("Error details copied to clipboard!");
    } catch {
      toast.error("Failed to copy error details.");
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg rounded-2xl border border-destructive/30 bg-card p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header Icon + Titles */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
            <AlertTriangle className="size-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {description}
            </p>
          </div>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="default"
            onClick={reset}
            className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-semibold"
            data-testid="error-retry-button"
          >
            <RotateCcw className="size-4" />
            <span>Try Again</span>
          </Button>

          <Link
            href={homeHref}
            className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 border-border bg-background hover:bg-muted hover:text-foreground h-8 px-2.5 w-full sm:w-auto gap-2 text-xs sm:text-sm font-semibold"
          >
            <ArrowLeft className="size-4" />
            <span>{homeLabel}</span>
          </Link>
        </div>

        {/* Technical Details Accordion */}
        <div className="border-t border-border/80 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1"
              aria-expanded={showDetails}
              aria-controls="error-technical-details"
            >
              <span>{showDetails ? "Hide technical details" : "Show technical details"}</span>
              {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showDetails && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyDetails}
                className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              >
                <Copy className="size-3" />
                <span>Copy</span>
              </Button>
            )}
          </div>

          {showDetails && (
            <div
              id="error-technical-details"
              className="mt-3 p-3 rounded-xl bg-muted/60 border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto space-y-1.5 max-h-48"
            >
              <p className="font-semibold text-foreground break-all">
                {error.name}: {error.message}
              </p>
              {error.digest && (
                <p className="text-[10px] text-muted-foreground">Digest: {error.digest}</p>
              )}
              {error.stack && (
                <pre className="text-[10px] whitespace-pre-wrap break-all leading-tight opacity-80 pt-1">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
