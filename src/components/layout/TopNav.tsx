"use client";

import { HeartHandshake } from "lucide-react";
import { Brand } from "@/components/brand/Brand";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useAnimationTheme } from "@/components/theme/DynamicBackground";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ProfileMenu, type ProfileMenuUser } from "@/components/layout/ProfileMenu";
import { cn } from "@/lib/utils";

export interface TopNavProps {
  user?: ProfileMenuUser | null;
}

export function TopNav({ user }: TopNavProps) {
  const { theme } = useAnimationTheme();
  const isCaregiver = user?.role === "caregiver";

  const themeHeaderStyles = {
    batman: "bg-slate-950/80 border-b border-cyan-500/20 shadow-[0_4px_25px_rgba(6,182,212,0.1)] text-slate-100 backdrop-blur-2xl",
    spidergwen: "bg-slate-950/80 border-b border-pink-500/20 shadow-[0_4px_25px_rgba(244,114,182,0.1)] text-slate-100 backdrop-blur-2xl",
    medical: "bg-slate-900/80 border-b border-emerald-500/20 shadow-[0_4px_25px_rgba(16,185,129,0.1)] text-slate-100 backdrop-blur-2xl",
  }[theme] || "bg-slate-900/80 border-b border-border/70 text-slate-100 backdrop-blur-2xl shadow-xs";

  return (
    <header className={cn("sticky top-0 z-20 flex h-16 w-full items-center justify-between px-4 sm:px-6 transition-all duration-300", themeHeaderStyles)}>
      {/* Left section: mobile brand mark + breadcrumbs + portal badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="lg:hidden shrink-0">
          <Brand size={32} showWordmark={false} href={isCaregiver ? "/caregiver" : "/dashboard"} />
        </div>
        <div className="min-w-0 flex items-center gap-2">
          <Breadcrumbs />
          {isCaregiver && (
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-secondary-tint text-secondary-foreground font-bold px-2.5 py-0.5 text-[10px] tracking-wide uppercase border border-secondary/20 shadow-xs">
              <HeartHandshake className="size-3 text-secondary" />
              Caregiver Mode
            </span>
          )}
        </div>
      </div>

      {/* Right section: theme switcher, language switcher, notifications & user profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeSwitcher />
        <LanguageSwitcher variant="pill" />
        <NotificationBell />
        <div className="h-4 w-px bg-white/20" aria-hidden="true" />
        <ProfileMenu user={user} />
      </div>
    </header>
  );
}
