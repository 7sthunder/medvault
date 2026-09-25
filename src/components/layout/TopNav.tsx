"use client";

import { Brand } from "@/components/brand/Brand";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ProfileMenu, type ProfileMenuUser } from "@/components/layout/ProfileMenu";

export interface TopNavProps {
  user?: ProfileMenuUser | null;
}

export function TopNav({ user }: TopNavProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-xl shadow-xs">
      {/* Left section: mobile brand mark + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="lg:hidden shrink-0">
          <Brand size={32} showWordmark={false} href="/dashboard" />
        </div>
        <div className="min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right section: notifications & user profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <NotificationBell />
        <div className="h-4 w-px bg-border/80" aria-hidden="true" />
        <ProfileMenu user={user} />
      </div>
    </header>
  );
}
