"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import type { ProfileMenuUser } from "@/components/layout/ProfileMenu";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { DemoDock } from "./DemoDock";

export interface DemoShellProps {
  demoUser: ProfileMenuUser;
  children: ReactNode;
}

export function DemoShell({ demoUser, children }: DemoShellProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const utils = api.useUtils();

  useEffect(() => {
    // Ensure demo cookie is active in browser session
    document.cookie = "medvault_demo_session=1; path=/; max-age=86400; SameSite=Lax";
  }, []);

  const leaveMutation = api.demo.leave.useMutation({
    onSuccess: () => {
      document.cookie = "medvault_demo_session=; path=/; max-age=0; SameSite=Lax";
      toast.success("Exited demo mode. Returning to real application.");
      router.push("/dashboard");
      router.refresh();
    },
    onError: () => {
      document.cookie = "medvault_demo_session=; path=/; max-age=0; SameSite=Lax";
      router.push("/login");
    },
    onSettled: () => {
      setIsLeaving(false);
    },
  });

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

  const handleExit = () => {
    setIsLeaving(true);
    leaveMutation.mutate();
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Demo Banner */}
      <header
        role="region"
        aria-label="Demo mode indicator banner"
        className="sticky top-0 z-40 border-b border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/40 backdrop-blur-md px-4 py-2 sm:px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              DEMO MODE
            </span>
            <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>Arun Kumar</span>
              <span className="text-muted-foreground hidden sm:inline">(§19 College Demonstration)</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground hidden lg:block">
            Isolated simulation database · Real user records are untouched · Clock & scenarios live
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={isResetting}
              onClick={() => resetMutation.mutate()}
              className="h-7 text-xs border-amber-500/40 hover:bg-amber-500/10 text-amber-900 dark:text-amber-200"
              data-testid="banner-reset-button"
            >
              <RotateCcw className="size-3 mr-1" />
              <span>Reset Seed</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              disabled={isLeaving}
              onClick={handleExit}
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-black"
              data-testid="banner-exit-button"
            >
              <LogOut className="size-3 mr-1" />
              <span>Exit Demo</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main AppShell with Demo User */}
      <div className="flex-1">
        <AppShell user={demoUser}>
          {children}
        </AppShell>
      </div>

      {/* Floating Simulation Dock */}
      <DemoDock />
    </div>
  );
}
