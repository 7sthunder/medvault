"use client";

import { HeartCrack } from "lucide-react";

import { DoctorMascot } from "@/features/landing/mascots";
import { useInView } from "@/features/landing/use-in-view";

/* Port of `App.jsx:1085–1148` (FinalCta). Cuttie floats (not absolute, keeps fluid flow);
   pastel ring + dashed arrow from Stitch. No circular dependency. */
export default function FinalCta() {
  const [ctaRef, ctaIn] = useInView<HTMLDivElement>();

  return (
    <section id="contact" className="overflow-hidden bg-white" style={{ padding: "20px 4% 100px" }}>
      <div
        ref={ctaRef}
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
          borderRadius: 40,
          maxWidth: 1300,
          margin: "0 auto",
          padding: "5% 4%",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
          boxShadow: "var(--shadow-primary-btn)",
          opacity: ctaIn ? 1 : 0,
          transform: ctaIn ? "translateY(0)" : "translateY(40px)",
          transition: "all 0.8s ease",
        }}
      >
        <div className="bg-white/10 absolute right-[-70px] top-[-70px] h-[200px] w-[200px] rounded-full" aria-hidden />
        <div className="bg-white/10 absolute bottom-[-80px] left-[-40px] h-[160px] w-[160px] rounded-full" aria-hidden />

        <div
          className="pointer-events-none absolute top-[-35px] right-[60px] hidden md:block"
          style={{ width: 100, height: 100, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.35)" }}
          aria-hidden
        >
          <div className="absolute -right-[6px] -bottom-[6px] text-sm text-white">➜</div>
        </div>

        <div
          className="bg-white/20 absolute top-[-12px] right-[124px] flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md"
          style={{ transform: "rotate(-12deg)" }}
          aria-hidden
        >
          <HeartCrack size={22} className="text-white" />
        </div>

        <h2
          className="font-heading text-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(28px,5vw,44px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: 30,
          }}
        >
          Your Health, One Vault Away.
          <br />
          No More Fragmented Care.
        </h2>

        <div style={{ marginBottom: 44 }} aria-hidden>
          <div className="pointer-events-none mx-auto" style={{ width: 180, maxWidth: "100%" }}>
            <DoctorMascot color="white" />
          </div>
        </div>

        <p className="text-white/85" style={{ fontSize: 15, fontWeight: 600, marginBottom: 26 }}>
          Ready to put your medical life in one place? 💚 Sign up today — free forever, no credit card.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", maxWidth: 600, margin: "0 auto", flexWrap: "wrap" }}>
          <input
            type="email"
            name="vaultEmail"
            placeholder="Enter your email — MedVault inbox"
            aria-label="Email for MedVault"
            className="w-full flex-1 rounded-2xl border border-white/30 bg-white/95 px-5 py-4 text-sm font-medium text-ink-900 outline-none"
            style={{ minWidth: 260, boxShadow: "var(--shadow-card)" }}
          />
          <a className="cta-white" href="/register" style={{ padding: "17px 38px", fontSize: 15.5, width: "auto" }}>
            Get Started
          </a>
        </div>

        <div className="text-white/65 mt-4 text-[12.5px]">
          Join 1,00,000+ patients who trust MedVault · <span className="underline underline-offset-2">Privacy-first</span>
        </div>
      </div>
    </section>
  );
}