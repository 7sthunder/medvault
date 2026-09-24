"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CheckCircle2, HeartPulse } from "lucide-react";

import ScrollingServices from "@/features/landing/ScrollingServices";

/* Bundle-split heavy hero visuals; framer-motion phone floats render client-only. */
const HeroVisual = dynamic(() => import("@/features/landing/HeroVisual"), {
  ssr: false,
  loading: () => <div className="hero-visual-container" style={{ minHeight: 580 }} />,
});

const AVATARS = [
  { label: "A", colorVar: "var(--color-primary)" },
  { label: "P", colorVar: "var(--color-secondary)" },
  { label: "R", colorVar: "var(--color-amber)" },
  { label: "S", colorVar: "var(--color-violet)" },
  { label: "M", colorVar: "var(--color-red)" },
];

/* Port of `App.jsx:749–876`. CTAs now route (register/demo); `heroIn` reveal kept. */
export default function Hero() {
  const [heroIn, setHeroIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  const reveal = (base: string, delay: string, offset = "24px") => ({
    opacity: heroIn ? 1 : 0,
    transform: heroIn ? "translateY(0)" : `translateY(${offset})`,
    transition: `all 0.7s ease ${delay}`,
  });

  return (
    <section
      id="hero"
      className="bg-hero-gradient relative flex min-h-dvh items-center"
      style={{ paddingTop: 68, overflow: "visible" }}
    >
      <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />

      <div className="bg-blob-primary pointer-events-none absolute hidden lg:block" style={{ top: "5%", right: "-8%", width: 520, height: 520, borderRadius: "50%" }} aria-hidden />
      <div className="bg-blob-secondary pointer-events-none absolute hidden lg:block" style={{ bottom: "5%", left: "-5%", width: 380, height: 380, borderRadius: "50%" }} aria-hidden />

      <div
        className="relative z-[2] flex w-full flex-wrap items-center"
        style={{ gap: "6%", padding: "40px 6% 80px" }}
      >
        <div style={{ flex: "1 1 480px", minWidth: 320 }}>
          <h1
            className="font-heading text-ink-900"
            style={{
              fontWeight: 900,
              fontSize: "clamp(42px,5.5vw,72px)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              marginBottom: 26,
              ...reveal("all", "0.1s"),
            }}
          >
            Your entire
            <br />
            medical life.
            <br />
            <span className="text-primary">One secure vault.</span>
          </h1>

          <p
            className="text-ink-500"
            style={{
              fontSize: "clamp(14px,1.8vw,17px)",
              lineHeight: 1.8,
              marginBottom: 28,
              maxWidth: 480,
              ...reveal("all", "0.2s", "16px"),
            }}
          >
            MedVault brings your medical records, medicine schedules, appointments, and AI-powered
            health guidance into one beautifully simple, secure platform.
          </p>

          <div style={{ marginBottom: 36, ...reveal("all", "0.25s", "16px"), display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
            <div className="font-heading text-ink-500 text-base font-bold">All in one vault, for your</div>
            <ScrollingServices />
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", ...reveal("all", "0.3s", "16px") }}>
            <Link href="/register" className="cta-primary" style={{ padding: "17px 42px", fontSize: 17, gap: 10 }}>
              <HeartPulse size={22} aria-hidden />
              Create Your Health Vault
            </Link>
            <Link href="/demo" className="cta-ghost" style={{ padding: "17px 32px", fontSize: 16 }}>
              ▶ Watch Demo
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 36, ...reveal("all", "0.45s") }}>
            <div className="flex">
              {AVATARS.map((a, i) => (
                <div
                  key={i}
                  aria-hidden
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${a.colorVar}, color-mix(in srgb, ${a.colorVar} 60%, transparent))`,
                    border: "2px solid white",
                    marginLeft: i === 0 ? 0 : -10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {a.label}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-[2px]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <CheckCircle2 key={s} size={12} className="fill-amber/[0.19] text-amber" aria-hidden />
                ))}
              </div>
              <div className="text-ink-500 mt-[2px] text-xs">Trusted by millions · Free forever</div>
            </div>
          </div>
        </div>

        <div
          className="relative z-[2] flex min-w-[320px] items-center justify-center"
          style={{ flex: "1 1 520px" }}
        >
          <HeroVisual isVisible={heroIn} />
        </div>
      </div>
    </section>
  );
}