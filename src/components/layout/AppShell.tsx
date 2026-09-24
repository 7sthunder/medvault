"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { ShellContext, type ShellUser } from "@/components/layout/shell-context";
import { TRPCProvider } from "@/lib/trpc";

export function AppShell({ children, user }: { children: ReactNode; user: ShellUser }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TRPCProvider>
      <ShellContext.Provider value={{ pathname, user }}>
        <div className="min-h-dvh bg-background">
          <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
          <div className="flex min-h-dvh flex-col lg:pl-64">
            <TopNav onOpenSidebar={() => setSidebarOpen(true)} />
            <div className="flex-1 pb-24 md:pb-10">
              <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </div>
          </div>
          <BottomNav />
        </div>
      </ShellContext.Provider>
    </TRPCProvider>
  );
}