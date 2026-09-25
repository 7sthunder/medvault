"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { useShell } from "@/components/layout/shell-context";

/**
 * Phase 18 — the "this is demo data" banner (plan §10.8).
 *
 * Non-negotiable UX requirement: nobody may mistake the shared demo workspace for their own
 * health record. The banner is therefore rendered for *both* visitors — signed in and signed out
 * — and always offers the same two exits: "enter the real app", or "leave demo".
 */
export function DemoBanner() {
  const router = useRouter();
  const { user, isDemo } = useShell();
  const utils = api.useUtils();
  const leave = api.demo.leave.useMutation({
    onSuccess: async () => {
      toast.success("You have left the demo");
      // The cookie is gone, so every cached demo query must go with it.
      utils.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6 lg:px-8"
    >
      <FlaskConical className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">
        <span className="font-semibold">This is demo data.</span> You&apos;re exploring a sample
        workspace for {user.name}. Nothing here is a real medical record.
      </p>
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button type="button" size="sm" variant="default">
            {isDemo ? "Enter the real app" : "Go to my dashboard"}
          </Button>
        </Link>
        {isDemo && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={leave.isPending}
            onClick={() => leave.mutate()}
          >
            <LogOut className="size-4" aria-hidden />
            Leave demo
          </Button>
        )}
      </div>
    </div>
  );
}
