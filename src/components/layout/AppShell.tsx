"use client";

import { useState, type ReactNode } from "react";
import { Mic } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { MoreSheet } from "@/components/layout/MoreSheet";
import { DynamicBackground, type AnimationTheme } from "@/components/theme/DynamicBackground";
import { VoiceAssistantDrawer } from "@/features/voice/VoiceAssistantDrawer";
import type { ProfileMenuUser } from "@/components/layout/ProfileMenu";

export interface AppShellProps {
  user?: ProfileMenuUser | null;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <div className="relative min-h-screen text-foreground flex">
      {/* Ambient Theme Background Animation */}
      <DynamicBackground initialTheme={(user?.animationTheme as AnimationTheme) || "medical"} />

      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:font-semibold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Spacer column for tablet and desktop to prevent layout shift when sidebar expands on hover */}
      <div className="w-16 shrink-0 hidden md:block" aria-hidden="true" />

      {/* Collapsed/Hover-expand Sidebar for Tablet & Desktop (>= 768px) */}
      <Sidebar
        user={user}
        className="hidden md:flex"
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0">
        <TopNav user={user} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8 focus:outline-none"
        >
          {children}
        </main>
      </div>

      {/* Mobile Floating Voice Assistant Mic Button (< md) */}
      <div className="fixed bottom-20 right-4 z-30 md:hidden">
        <button
          type="button"
          onClick={() => setIsVoiceOpen(true)}
          aria-label="Open voice assistant"
          className="group relative flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-primary via-teal-500 to-secondary text-white shadow-[0_4px_20px_rgba(6,182,212,0.45)] border border-white/25 active:scale-90 hover:scale-105 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="absolute -inset-1 rounded-full animate-ping opacity-35 bg-cyan-400 pointer-events-none" />
          <Mic className="size-5 text-white relative z-10 transition-transform group-hover:scale-110" />
        </button>
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

      {/* Shell-Level Voice Assistant Drawer for Mobile & Desktop */}
      {isVoiceOpen && <VoiceAssistantDrawer open={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />}
    </div>
  );
}
