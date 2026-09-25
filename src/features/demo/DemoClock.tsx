"use client";

import { useState } from "react";
import { Clock, FastForward, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";

interface DemoClockProps {
  simulationNow: Date | null;
}

export function DemoClock({ simulationNow }: DemoClockProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const utils = api.useUtils();

  const currentTime = simulationNow ? new Date(simulationNow) : new Date();

  const setTimeMutation = api.demo.setTime.useMutation({
    onSuccess: (data) => {
      void utils.demo.getState.invalidate();
      void utils.dashboard.get.invalidate();
      void utils.dose.today.invalidate();
      toast.success(
        data.simulationNow
          ? `Clock shifted to ${new Date(data.simulationNow).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
          : "Clock restored to real-time.",
      );
    },
    onError: (err) => {
      toast.error(err.message || "Failed to shift simulation clock.");
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const shiftTime = (hours: number) => {
    setIsUpdating(true);
    const target = new Date(currentTime.getTime() + hours * 3600000);
    setTimeMutation.mutate({ time: target.toISOString() });
  };

  const handleResetTime = () => {
    setIsUpdating(true);
    setTimeMutation.mutate({ time: null });
  };

  return (
    <div data-testid="demo-clock" className="space-y-2 rounded-xl border border-border/80 bg-background/60 p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Clock className="size-3.5 text-primary" />
          <span>Simulation Time</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {simulationNow ? "Custom Clock" : "Live Clock"}
        </span>
      </div>

      <div className="text-sm font-bold font-mono text-primary flex items-center justify-between">
        <span>
          {currentTime.toLocaleDateString([], { month: "short", day: "numeric" })} ·{" "}
          {currentTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
        {simulationNow && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetTime}
            disabled={isUpdating}
            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={() => shiftTime(-24)}
          className="h-7 px-1 text-[10px]"
        >
          <History className="size-2.5 mr-0.5" />
          -1d
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={() => shiftTime(-4)}
          className="h-7 px-1 text-[10px]"
        >
          -4h
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={() => shiftTime(4)}
          className="h-7 px-1 text-[10px]"
        >
          +4h
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={() => shiftTime(24)}
          className="h-7 px-1 text-[10px]"
        >
          <FastForward className="size-2.5 mr-0.5" />
          +1d
        </Button>
      </div>
    </div>
  );
}
