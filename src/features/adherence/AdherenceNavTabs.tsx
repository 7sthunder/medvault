"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LineChart } from "lucide-react";

export function AdherenceNavTabs() {
  const pathname = usePathname();
  const isMedications = pathname?.includes("/adherence/medications");

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      <Link
        href="/adherence"
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          !isMedications
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100"
        }`}
      >
        <LineChart className="size-3.5" />
        <span>Overview</span>
      </Link>
      <Link
        href="/adherence/medications"
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          isMedications
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100"
        }`}
      >
        <BarChart3 className="size-3.5" />
        <span>By Medication</span>
      </Link>
    </div>
  );
}
