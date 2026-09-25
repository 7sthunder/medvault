"use client";

import { HeartHandshake } from "lucide-react";
import { Brand } from "@/components/brand/Brand";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ProfileMenu, type ProfileMenuUser } from "@/components/layout/ProfileMenu";

export interface TopNavProps {
  user?: ProfileMenuUser | null;
}

export function TopNav({ user }: TopNavProps) {
  const isCaregiver = user?.role === "caregiver";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-xl shadow-xs">
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

      {/* Right section: language switcher, notifications & user profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <LanguageSwitcher variant="pill" />
        <NotificationBell />
        <div className="h-4 w-px bg-border/80" aria-hidden="true" />
        <ProfileMenu user={user} />
      </div>
    </header>
  );
}
