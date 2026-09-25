"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { ShellContext, type ShellUser } from "@/components/layout/shell-context";
import { TRPCProvider } from "@/lib/trpc";

export function AppShell({
  children,
  user,
  isDemo = false,
  basePath,
  overlay,
}: {
  children: ReactNode;
  user: ShellUser;
  /** Phase 18 (§10.8): the `/demo` layout renders the same shell over the demo workspace. */
  isDemo?: boolean;
  /** Prefix applied to every nav href (see `nav-model.ts`). */
  basePath?: string;
  /** Optional fixed-position layer (the demo simulation dock) rendered above the shell. */
  overlay?: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TRPCProvider>
      <ShellContext.Provider value={{ pathname, user, isDemo, basePath }}>
        <div className="min-h-dvh bg-background">
          <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
          <div className="flex min-h-dvh flex-col lg:pl-64">
            <TopNav onOpenSidebar={() => setSidebarOpen(true)} />
            <div className="flex-1 pb-24 md:pb-10">
              <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </div>
          </div>
          <BottomNav />
          {overlay}
        </div>
      </ShellContext.Provider>
    </TRPCProvider>
  );
}
