"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";

interface RegenerateButtonProps {
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function RegenerateButton({
  variant = "default",
  size = "sm",
  className,
}: RegenerateButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const utils = api.useUtils();

  const regenerateMutation = api.insights.regenerate.useMutation({
    onMutate: () => {
      setIsRefreshing(true);
    },
    onSuccess: (data) => {
      const count = data.length;
      toast.success(
        count > 0
          ? `Generated ${count} fresh adherence insight${count > 1 ? "s" : ""}!`
          : "Insights refreshed successfully!",
      );
      void utils.insights.list.invalidate();
      void utils.insights.latest.invalidate();
      void utils.dashboard.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to analyze adherence patterns.");
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  const handleClick = () => {
    regenerateMutation.mutate();
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isRefreshing || regenerateMutation.isPending}
      onClick={handleClick}
      className={className}
      data-testid="regenerate-insights-button"
    >
      {isRefreshing || regenerateMutation.isPending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>Analyzing Patterns...</span>
        </>
      ) : (
        <>
          <Sparkles className="size-3.5" />
          <span>Refresh Insights</span>
        </>
      )}
    </Button>
  );
}
