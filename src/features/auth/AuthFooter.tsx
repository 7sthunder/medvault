import Link from "next/link";

import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";

/**
 * Phase 06 — shared auth page footer: "OR" divider, Google option (disabled until
 * an OAuth provider lands), and the login/register switch preserving `next`.
 */
export function AuthFooter({ mode, next }: { mode: "login" | "register"; next?: string | null }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const target = mode === "login" ? `/register${q}` : `/login${q}`;
  return (
    <>
      <div className="my-6 flex items-center gap-4">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-[13px] font-bold text-muted-foreground">OR</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" size="lg" disabled>
        <GoogleIcon className="size-5" />
        Continue with Google
      </Button>

      <p className="mt-8 pb-4 text-center text-sm text-muted-foreground">
        {mode === "login"
          ? "Don't have a MediTrack AI account? "
          : "Already have a MediTrack AI account? "}
        <Link href={target} className="font-extrabold text-primary hover:underline">
          {mode === "login" ? "Sign up" : "Log in"}
        </Link>
      </p>
    </>
  );
}
