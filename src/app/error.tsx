"use client";

import { useEffect } from "react";
import { RichErrorBoundary } from "@/components/ui/rich-error-boundary";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <RichErrorBoundary
        error={error}
        reset={reset}
        title="MedVault System Notice"
        description="A system error occurred. We've preserved your local session and data."
        homeHref="/"
        homeLabel="Return to MedVault"
      />
    </div>
  );
}
