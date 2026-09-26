"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { ClockProvider } from "@/components/layout/clock-context";
import { ShellContext, type ShellUser } from "@/components/layout/shell-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AssistantLauncher } from "@/features/assistant/AssistantPanel";
import { AssistantProvider } from "@/features/assistant/assistant-context";
import { TRPCProvider } from "@/lib/trpc";

export function AppShell({
  children,
  user,
  isDemo = false,
  basePath,
  overlay,
  simulationNow,
}: {
  children: ReactNode;
  user: ShellUser;
  /** Phase 18 (§10.8): the `/demo` layout renders the same shell over the demo workspace. */
  isDemo?: boolean;
  /** Prefix applied to every nav href (see `nav-model.ts`). */
  basePath?: string;
  /** Optional fixed-position layer (the demo simulation dock) rendered above the shell. */
  overlay?: ReactNode;
  /** Phase 19: server-resolved simulated instant, mirrored into the browser clock. */
  simulationNow?: Date | null;
}) {
  const pathname = usePathname();

  return (
    <TRPCProvider>
      <AssistantProvider>
        <ClockProvider enabled={isDemo} initialSimulationNow={simulationNow}>
          <ShellContext.Provider value={{ pathname, user, isDemo, basePath }}>
            {/* The provider owns the collapse state and the two width tokens; `SidebarInset` picks up
              the content offset from the sidebar's in-flow gap, so nothing here hardcodes a width. */}
            <SidebarProvider>
              <SkipLink />
              <Sidebar />
              <SidebarInset>
                <TopNav />
                {/* Skip-link target. Deliberately a plain focusable div, not a second <main>: every
                feature page already renders its own <main> landmark, and nesting or duplicating
                them is invalid and trips axe's `landmark-no-duplicate-main`. */}
                <div
                  id="main-content"
                  tabIndex={-1}
                  className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] focus:outline-none md:pb-10"
                >
                  <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                  </div>
                </div>
              </SidebarInset>
              <BottomNav />
              {overlay}
              <AssistantLauncher />
            </SidebarProvider>
          </ShellContext.Provider>
        </ClockProvider>
      </AssistantProvider>
    </TRPCProvider>
  );
}

/**
 * WCAG 2.4.1 (Bypass Blocks). The sidebar + top nav render before any page content, so a keyboard
 * user otherwise has to tab through every nav link on every screen to reach the page. Hidden until
 * focused, at which point it becomes the very first tab stop.
 */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-900 focus:shadow-card"
    >
      Skip to main content
    </a>
  );
}
