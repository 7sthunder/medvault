import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white p-8 text-center">
      <div
        aria-hidden
        className="flex size-10 items-center justify-center rounded-[11px] bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
      >
        <Heart className="size-5" fill="currentColor" strokeWidth={0} />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">MedVault</h1>
      <p className="text-slate-500">
        Project foundation (Phase 02) — the Stitch landing page migrates here in Phase 04.
      </p>
      <Button>Get started</Button>
    </main>
  );
}