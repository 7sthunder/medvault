"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "cn";

import { getPageContext } from "@/components/layout/nav-model";
import { useShell } from "@/components/layout/shell-context";

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useShell();
  const { crumbs } = getPageContext(pathname);

  return (
    <nav aria-label="Breadcrumbs" className={cn("min-w-0 flex-1 items-center gap-1.5 text-sm", className)}>
      <ol className="flex min-w-0 items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-ink-900"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate font-medium text-ink-900">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}