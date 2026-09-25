import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Brand } from "@/components/brand/Brand";
import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { DynamicBackground } from "@/components/theme/DynamicBackground";

export interface AuthShellProps extends React.PropsWithChildren {
  className?: string;
}

/**
 * Phase 06 — Stitch auth split layout (MedVaultAuthIllustration): full-height
 * image panel hidden below 900px, centered form column max-w 460px, mobile:
 * single column with a back button pinned top-right.
 */
export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className={cn("relative grid min-h-dvh bg-background lg:grid-cols-[1.1fr_0.9fr]", className)}>
      <DynamicBackground forceTheme="medical" />
      <div className="bg-muted relative hidden min-[900px]:block overflow-hidden">
        <Image
          src="/auth/login-page.jpeg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background to-transparent"
        />
      </div>

      <div className="relative flex flex-col">
        <div className="absolute top-6 right-6 z-10 flex items-center gap-3 sm:top-8 sm:right-8">
          <LanguageSwitcher variant="pill" />
          <Link
            href="/"
            aria-label="Back to landing"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-ink-800 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>

        <div className="m-auto flex w-full max-w-[460px] flex-col px-6 py-12 sm:px-10">
          <div className="mb-10">
            <Brand size={44} wordmarkSize={26} href="/" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}