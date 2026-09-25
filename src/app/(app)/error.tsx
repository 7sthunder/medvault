"use client";

import { useEffect } from "react";
import { RichErrorBoundary } from "@/components/ui/rich-error-boundary";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <RichErrorBoundary
      error={error}
      reset={reset}
      title="Application Error"
      description="An error occurred while loading this section of MedVault. Your medication data is safe."
      homeHref="/dashboard"
      homeLabel="Return to Dashboard"
    />
  );
}
