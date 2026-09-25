"use client";

import { useEffect } from "react";
import { RichErrorBoundary } from "@/components/ui/rich-error-boundary";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth flow error:", error);
  }, [error]);

  return (
    <RichErrorBoundary
      error={error}
      reset={reset}
      title="Authentication Error"
      description="An error occurred during authentication. Please retry or return to the sign-in page."
      homeHref="/login"
      homeLabel="Return to Sign In"
    />
  );
}
