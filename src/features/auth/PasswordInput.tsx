"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";

/**
 * Phase 06 — password field with a show/hide toggle (Stitch auth design).
 * Consumed inside `FormField` (receives id/aria-* via cloning).
 */
export function PasswordInput({ disabled, ...props }: React.ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} disabled={disabled} className="pr-10" {...props} />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((v) => !v)}
        disabled={disabled}
        className="absolute top-1/2 right-2 flex -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:outline-none"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
