"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Phase 06 — placeholder completion: calls the protected
 * `auth.setOnboardingComplete` tRPC mutation so the post-login redirect loop is
 * not a dead end until the real onboarding flow ships.
 */
export function SkipOnboardingButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/trpc/auth.setOnboardingComplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error(`tRPC ${res.status}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't finish setting up your vault right now. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button onClick={complete} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Continue to dashboard
        {!busy && <ArrowRight aria-hidden="true" />}
      </Button>
    </div>
  );
}
