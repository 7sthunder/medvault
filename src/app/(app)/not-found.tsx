import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span
        className="flex size-14 items-center justify-center rounded-2xl bg-primary-tint text-primary-dark"
        aria-hidden="true"
      >
        <FileQuestion className="size-7" strokeWidth={2.2} />
      </span>
      <div className="grid gap-1.5">
        <h1 className="font-heading text-lg font-semibold text-ink-900">Page not found</h1>
        <p className="text-sm text-muted-foreground">This page doesn&apos;t exist or has moved.</p>
      </div>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "default" }))}>
        Back to dashboard
      </Link>
    </section>
  );
}