"use client";

import { Menu } from "lucide-react";

import { Brand } from "@/components/brand/Brand";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Button } from "@/components/ui/button";
import { withBasePath } from "@/components/layout/nav-model";
import { useShell } from "@/components/layout/shell-context";

export function TopNav({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { basePath } = useShell();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
      >
        <Menu aria-hidden="true" />
      </Button>
      <div className="md:hidden">
        <Brand size={32} weight="normal" href={withBasePath("/dashboard", basePath)} />
      </div>
      <Breadcrumbs className="hidden md:flex" />
      <div className="ms-auto flex items-center gap-1">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
