import { Brand } from "@/components/brand/Brand";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="bg-hero-gradient flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <Brand size={40} wordmarkSize={22} />
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink-900">
        MedVault
      </h1>
      <p className="max-w-md text-[15px] text-ink-600">
        Project foundation (Phase 02) — the Stitch landing page migrates here in Phase 04.
      </p>
      <Button size="lg">Get started</Button>
    </main>
  );
}