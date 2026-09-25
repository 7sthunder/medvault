"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbSegment {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  medications: "Medications",
  schedule: "Today's Schedule",
  history: "History",
  adherence: "Adherence",
  insights: "AI Insights",
  reports: "Reports",
  caregiver: "Caregiver",
  notifications: "Notifications",
  settings: "Settings",
  profile: "Profile",
  reminders: "Reminders",
  appearance: "Appearance",
  data: "Your Data",
  help: "Help",
  new: "New",
  edit: "Edit",
  accept: "Accept Invitation",
  alerts: "Alerts",
};

export function getBreadcrumbSegments(pathname: string): BreadcrumbSegment[] {
  if (!pathname || pathname === "/" || pathname === "/dashboard") {
    return [{ label: "Dashboard", isCurrent: true }];
  }

  const rawSegments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbSegment[] = [{ label: "Dashboard", href: "/dashboard" }];

  let accumulatedPath = "";
  for (let i = 0; i < rawSegments.length; i++) {
    const raw = rawSegments[i]!;
    accumulatedPath += `/${raw}`;
    const isLast = i === rawSegments.length - 1;
    
    // Label resolution
    let label = ROUTE_LABELS[raw];
    if (!label) {
      // Could be an ID like [id] or [doseId]
      if (raw.length > 10 || /^[0-9a-f-]{12,}$/i.test(raw)) {
        label = "Details";
      } else {
        label = raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, " ");
      }
    }

    // Skip dashboard duplicate if pathname started with /dashboard
    if (i === 0 && raw === "dashboard") {
      continue;
    }

    items.push({
      label,
      href: isLast ? undefined : accumulatedPath,
      ...(isLast ? { isCurrent: true } : {}),
    });
  }

  return items;
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = getBreadcrumbSegments(pathname);

  return (
    <nav aria-label="Breadcrumbs" className={cn("flex items-center text-xs sm:text-sm text-slate-300", className)}>
      <ol className="flex items-center flex-wrap gap-1.5" role="list">
        {segments.map((seg, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight className="size-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            )}
            {seg.isCurrent || !seg.href ? (
              <span
                aria-current={seg.isCurrent ? "page" : undefined}
                className={cn("font-medium", seg.isCurrent && "font-semibold text-white")}
              >
                {seg.label}
              </span>
            ) : (
              <Link
                href={seg.href}
                className="hover:text-white text-slate-400 transition-colors"
              >
                {seg.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
