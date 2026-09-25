"use client";

import type { ReactNode } from "react";
import { Sparkles, User } from "lucide-react";

import { cn } from "cn";

/**
 * One message in a conversation. The assistant sits on `bg-primary-soft`, the token the design
 * system already documents for chat bubbles (`src/lib/token-doc.ts`); the patient sits on
 * `bg-muted` so the two sides are distinguishable without relying on colour alone.
 */
export function ChatBubble({
  role,
  children,
  className,
}: {
  role: "user" | "assistant" | "system";
  children: ReactNode;
  className?: string;
}) {
  if (role === "system") {
    return (
      <p className={cn("mx-auto max-w-md text-center text-xs text-ink-500", className)}>
        {children}
      </p>
    );
  }

  const mine = role === "user";
  const Icon = mine ? User : Sparkles;
  return (
    <div className={cn("flex items-start gap-2", mine && "flex-row-reverse")}>
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
          mine ? "bg-muted text-ink-600" : "bg-primary-tint text-primary-dark",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          mine
            ? "rounded-tr-sm bg-muted text-ink-900"
            : "rounded-tl-sm bg-primary-soft text-ink-900",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
