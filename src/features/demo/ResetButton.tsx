"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";

export function ResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const utils = api.useUtils();

  const resetMutation = api.demo.reset.useMutation({
    onMutate: () => {
      setIsResetting(true);
    },
    onSuccess: () => {
      toast.success("Demo environment restored to pristine benchmark (Arun Kumar §19).");
      void utils.demo.getState.invalidate();
      void utils.dashboard.get.invalidate();
      void utils.dose.today.invalidate();
      void utils.medication.list.invalidate();
      void utils.adherence.summary.invalidate();
      void utils.caregiver.listAlerts.invalidate();
      void utils.insights.list.invalidate();
      void utils.notifications.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reset demo dataset.");
    },
    onSettled: () => {
      setIsResetting(false);
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isResetting || resetMutation.isPending}
      onClick={() => resetMutation.mutate()}
      className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
      data-testid="reset-demo-button"
    >
      {isResetting || resetMutation.isPending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>Restoring §19 Baseline...</span>
        </>
      ) : (
        <>
          <RotateCcw className="size-3.5" />
          <span>Reset Demo Workspace</span>
        </>
      )}
    </Button>
  );
}
