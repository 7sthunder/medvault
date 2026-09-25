"use client";

import { useEffect } from "react";
import { RichErrorBoundary } from "@/components/ui/rich-error-boundary";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return (
    <RichErrorBoundary
      error={error}
      reset={reset}
      title="Personalization Setup Notice"
      description="An error occurred while saving your initial preferences. You can retry setup or proceed to the dashboard."
      homeHref="/dashboard"
      homeLabel="Go to Dashboard"
    />
  );
}
