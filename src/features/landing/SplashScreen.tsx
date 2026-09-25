"use client";
/* eslint-disable no-restricted-syntax */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Cinematic full-screen splash screen that plays once on page load.
 * Features:
 *  - Dark background with glowing green particles (canvas-based)
 *  - Animated ECG/heartbeat line
 *  - MedVault logo & wordmark reveal
 *  - Auto-dismisses after ~2.8s with a smooth fade transition
 */

// ── Canvas Particle System ───────────────────────────────────────────────────

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Generate particles
    const COUNT = 110;
    type Particle = {
      x: number; y: number; r: number;
      vx: number; vy: number;
      opacity: number; opacityDir: number;
      color: string;
    };
    const COLORS = [
      "rgba(16,185,129,", // emerald
      "rgba(6,182,212,",  // cyan
      "rgba(52,211,153,", // emerald light
      "rgba(20,184,166,", // teal
    ];

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.6 + 0.1,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "rgba(16,185,129,",
    }));

    // Medical cross shapes (rare, larger)
    type Cross = { x: number; y: number; size: number; opacity: number; rotation: number; rotDir: number };
    const crosses: Cross[] = Array.from({ length: 8 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 6 + 4,
      opacity: Math.random() * 0.25 + 0.05,
      rotation: Math.random() * Math.PI * 2,
      rotDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const drawCross = (x: number, y: number, size: number, opacity: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = "rgba(16,185,129,1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-size, 0); ctx.lineTo(size, 0);
      ctx.moveTo(0, -size); ctx.lineTo(0, size);
      ctx.stroke();
      ctx.restore();
    };

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.012;

      // Background radial glow
      const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.7);
      grd.addColorStop(0, "rgba(16,185,129,0.10)");
      grd.addColorStop(0.5, "rgba(6,182,212,0.04)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        p.opacity += p.opacityDir * 0.004;
        if (p.opacity > 0.75 || p.opacity < 0.05) p.opacityDir *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity.toFixed(2)})`;
        ctx.fill();

        // Glow halo for larger particles
        if (p.r > 1.5) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          halo.addColorStop(0, `${p.color}${(p.opacity * 0.3).toFixed(2)})`);
          halo.addColorStop(1, "transparent");
          ctx.fillStyle = halo;
          ctx.fillRect(p.x - p.r * 5, p.y - p.r * 5, p.r * 10, p.r * 10);
        }
      }

      // Crosses
      for (const c of crosses) {
        c.rotation += c.rotDir * 0.003;
        drawCross(c.x, c.y, c.size, c.opacity, c.rotation);
      }

      // ECG waveform line across center
      const ecgY = H * 0.5;
      const ecgWidth = W * 0.75;
      const ecgLeft = (W - ecgWidth) / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(16,185,129,0.55)";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(ecgLeft, ecgY);

      // Draw a repeating ECG pattern
      const pxPerCycle = 100;
      const cycles = Math.ceil(ecgWidth / pxPerCycle);
      const offset = (t * 80) % pxPerCycle;

      for (let c = -1; c <= cycles; c++) {
        const bx = ecgLeft + c * pxPerCycle - offset;
        // Flat left
        ctx.lineTo(bx + 10, ecgY);
        // P wave
        ctx.quadraticCurveTo(bx + 15, ecgY - 5, bx + 20, ecgY);
        // Flat PR
        ctx.lineTo(bx + 28, ecgY);
        // Q down
        ctx.lineTo(bx + 32, ecgY + 8);
        // R up (spike)
        ctx.lineTo(bx + 36, ecgY - 32);
        // S down
        ctx.lineTo(bx + 40, ecgY + 6);
        // Back baseline
        ctx.lineTo(bx + 46, ecgY);
        // T wave
        ctx.quadraticCurveTo(bx + 55, ecgY - 14, bx + 64, ecgY);
        ctx.lineTo(bx + pxPerCycle, ecgY);
      }
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [active, canvasRef]);
}

// ── DNA Helix SVG (animated CSS) ─────────────────────────────────────────────

function DnaHelix() {
  return (
    <svg
      width="60"
      height="200"
      viewBox="0 0 60 200"
      aria-hidden
      style={{ position: "absolute", left: "18%", top: "20%", opacity: 0.35 }}
    >
      <defs>
        <linearGradient id="dna-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {Array.from({ length: 10 }, (_, i) => {
        const y1 = i * 20 + 5;
        const y2 = i * 20 + 15;
        return (
          <g key={i}>
            <line x1="10" y1={y1} x2="50" y2={y2} stroke="url(#dna-grad)" strokeWidth="1.5" />
          </g>
        );
      })}
      <path
        d="M10 5 Q30 15 10 25 Q30 35 10 45 Q30 55 10 65 Q30 75 10 85 Q30 95 10 105 Q30 115 10 125 Q30 135 10 145 Q30 155 10 165 Q30 175 10 185 Q30 195 10 200"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        opacity="0.7"
      />
      <path
        d="M50 5 Q30 15 50 25 Q30 35 50 45 Q30 55 50 65 Q30 75 50 85 Q30 95 50 105 Q30 115 50 125 Q30 135 50 145 Q30 155 50 165 Q30 175 50 185 Q30 195 50 200"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  );
}

// ── MedVault Logo SVG (inline) ────────────────────────────────────────────────

function SplashLogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="splash-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="splash-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#splash-tile)" filter="url(#splash-glow)" />
      <path
        d="M6 14.5H11.2L13.7 9l4.6 15 3-8h4.7"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Main SplashScreen ─────────────────────────────────────────────────────────

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "out">("intro");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useParticleCanvas(canvasRef, true);

  useEffect(() => {
    // Phase timeline:
    // 0ms   → canvas + BG appears
    // 400ms → logo + text animate in (phase: reveal)
    // 2400ms → fade out starts (phase: out)
    // 2900ms → onComplete called

    const t1 = setTimeout(() => setPhase("reveal"), 400);
    const t2 = setTimeout(() => setPhase("out"), 2400);
    const t3 = setTimeout(() => onComplete(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "out" ? 0 : 1 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#020a05",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Skip button in top right */}
      <button
        type="button"
        onClick={onComplete}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 100,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(16,185,129,0.35)",
          color: "rgba(255,255,255,0.85)",
          fontSize: 13,
          fontWeight: 600,
          padding: "7px 16px",
          borderRadius: 20,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Skip Intro ✕
      </button>

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* DNA Helix decorations */}
      <DnaHelix />
      <svg
        width="60"
        height="200"
        viewBox="0 0 60 200"
        aria-hidden
        style={{ position: "absolute", right: "18%", top: "20%", opacity: 0.25, transform: "scaleX(-1)" }}
      >
        <path
          d="M10 5 Q30 15 10 25 Q30 35 10 45 Q30 55 10 65 Q30 75 10 85 Q30 95 10 105 Q30 115 10 125 Q30 135 10 145 Q30 155 10 165 Q30 175 10 185 Q30 195 10 200"
          fill="none" stroke="#10b981" strokeWidth="2" opacity="0.7"
        />
        <path
          d="M50 5 Q30 15 50 25 Q30 35 50 45 Q30 55 50 65 Q30 75 50 85 Q30 95 50 105 Q30 115 50 125 Q30 135 50 145 Q30 155 50 165 Q30 175 50 185 Q30 195 50 200"
          fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.5"
        />
      </svg>

      {/* Concentric glow rings */}
      {[300, 220, 150].map((size, i) => (
        <motion.div
          key={i}
          aria-hidden
          initial={{ scale: 0, opacity: 0 }}
          animate={phase !== "intro" ? {
            scale: [1, 1.04, 1],
            opacity: [0.12 - i * 0.025, 0.18 - i * 0.025, 0.12 - i * 0.025],
          } : { scale: 0, opacity: 0 }}
          transition={{
            delay: 0.1 * i,
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            border: `1px solid rgba(16,185,129,${0.5 - i * 0.1})`,
            boxShadow: `0 0 ${20 + i * 10}px rgba(16,185,129,0.3)`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Center logo block */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Logo icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={phase !== "intro" ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.05 }}
          style={{
            filter: "drop-shadow(0 0 20px rgba(16,185,129,0.8)) drop-shadow(0 0 40px rgba(16,185,129,0.4))",
          }}
        >
          <SplashLogo size={72} />
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={phase !== "intro" ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.55, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              fontFamily: "var(--font-jakarta, system-ui), sans-serif",
              fontWeight: 800,
              fontSize: 38,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
            }}
          >
            MedVault
          </div>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={phase !== "intro" ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{
              height: 2,
              background: "linear-gradient(90deg, transparent, #10b981, #06b6d4, transparent)",
              marginTop: 8,
              borderRadius: 2,
            }}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={phase !== "intro" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            style={{
              marginTop: 12,
              color: "rgba(16,185,129,0.65)",
              fontSize: 13.5,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "var(--font-jakarta, system-ui), sans-serif",
            }}
          >
            Your Health. One Vault.
          </motion.p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={phase !== "intro" ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            width: 160,
            height: 2,
            background: "rgba(16,185,129,0.2)",
            borderRadius: 2,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={phase !== "intro" ? { width: "100%" } : { width: "0%" }}
            transition={{ duration: 1.5, delay: 0.85, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #10b981, #06b6d4)",
              borderRadius: 2,
              boxShadow: "0 0 8px rgba(16,185,129,0.6)",
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
