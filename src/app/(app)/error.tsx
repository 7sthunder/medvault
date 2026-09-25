"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { log } from "@/lib/log";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Application route failed", { error, digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <ErrorState
        icon={AlertTriangle}
        title="Something went wrong"
        description="The page couldn't be loaded. Your data is safe — try again in a moment."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
