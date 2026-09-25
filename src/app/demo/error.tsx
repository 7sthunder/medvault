"use client";

import { useEffect } from "react";
import { RichErrorBoundary } from "@/components/ui/rich-error-boundary";

export default function DemoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Demo error:", error);
  }, [error]);

  return (
    <RichErrorBoundary
      error={error}
      reset={reset}
      title="Simulation Workspace Notice"
      description="An error occurred inside the demo environment. You can retry the action or restore the pristine §19 seed."
      homeHref="/demo"
      homeLabel="Return to Demo Dashboard"
    />
  );
}
