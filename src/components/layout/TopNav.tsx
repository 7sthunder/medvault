"use client";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 sm:px-6 lg:px-8">
      {/* One trigger for both cases: the primitive collapses the rail on desktop and opens the
          drawer below `lg`, so the separate hamburger is no longer needed. */}
      <SidebarTrigger className="-ms-1" />
      <Breadcrumbs className="hidden md:flex" />
      <div className="ms-auto flex items-center gap-1">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
