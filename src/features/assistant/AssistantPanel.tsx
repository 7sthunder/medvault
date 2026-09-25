"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic } from "lucide-react";

import { cn } from "cn";
import { api } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AssistantThread } from "@/features/assistant/AssistantThread";

/**
 * Chrome around {@link AssistantThread}. `variant` only changes the surrounding frame — the
 * conversation itself is identical on the page and in the launcher, because both read the same
 * store.
 */
export function AssistantPanel({
  variant,
  className,
}: {
  variant: "page" | "sheet";
  className?: string;
}) {
  const status = api.assistant.status.useQuery();
  const enabled = status.data?.enabled !== false;

  if (!enabled) {
    return (
      <Alert className={className}>
        <Mic className="size-4" aria-hidden />
        <AlertDescription>
          Voice entry needs a Gemini API key. Add a medication with the{" "}
          <Link href="/medications/new" className="font-semibold underline">
            medication form
          </Link>{" "}
          instead.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {variant === "page" ? (
        <header className="mb-3">
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">Voice assistant</h1>
          <p className="mt-1 text-sm text-ink-600">
            Add a medication by talking. I will ask for anything I miss and read it back before
            saving.
          </p>
        </header>
      ) : (
        <p className="mb-3 text-sm text-ink-600">Add a medication by talking.</p>
      )}
      <AssistantThread variant={variant} className="min-h-0 flex-1" />
    </div>
  );
}

/** Small floating launcher, rendered by the shell on every signed-in page. */
export function AssistantLauncher() {
  const status = api.assistant.status.useQuery();
  const [open, setOpen] = useState(false);

  // On the page itself the launcher is redundant.
  const pathname = usePathname();
  if (status.isLoading || status.data?.enabled === false || pathname?.endsWith("/assistant")) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open voice assistant"
        className="fixed bottom-24 right-4 z-40 size-12 rounded-full p-0 shadow-fab md:right-6 md:bottom-6"
      >
        <Mic className="size-5" aria-hidden />
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Voice assistant"
        description="Add a medication by talking."
        className="sm:max-w-lg"
      >
        <div className="min-h-0">
          <AssistantPanel variant="sheet" />
        </div>
      </ResponsiveDialog>
    </>
  );
}
