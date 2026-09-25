"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { MoreSheet } from "@/components/layout/MoreSheet";
import { DynamicBackground } from "@/components/theme/DynamicBackground";
import type { ProfileMenuUser } from "@/components/layout/ProfileMenu";

export interface AppShellProps {
  user?: ProfileMenuUser | null;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground flex">
      {/* Ambient Theme Background Animation */}
      <DynamicBackground initialTheme={(user?.animationTheme as "batman" | "spidergwen" | "medical") || "medical"} />

      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:font-semibold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Spacer column for desktop to prevent layout shift when sidebar expands on hover */}
      <div className="w-16 shrink-0 hidden lg:block" aria-hidden="true" />

      {/* Collapsed/Hover-expand Desktop Sidebar */}
      <Sidebar user={user} className="hidden lg:flex" />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0">
        <TopNav user={user} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 focus:outline-none"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (< md) */}
      <BottomNav
        onMoreClick={() => setIsMoreSheetOpen((prev) => !prev)}
        isMoreOpen={isMoreSheetOpen}
      />

      {/* Mobile More Sheet */}
      <MoreSheet
        open={isMoreSheetOpen}
        onOpenChange={setIsMoreSheetOpen}
      />
    </div>
  );
}
