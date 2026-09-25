"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type AnimationTheme = "batman" | "spidergwen" | "medical";

interface DynamicBackgroundProps {
  initialTheme?: AnimationTheme;
  className?: string;
}

export const THEME_CONFIG: Record<
  AnimationTheme,
  {
    name: string;
    image: string;
    glow1: string;
    glow2: string;
    accentClass: string;
  }
> = {
  batman: {
    name: "Batman Dark Knight",
    image: "/themes/batman.jpg",
    glow1: "rgba(59, 130, 246, 0.12)",
    glow2: "rgba(15, 23, 42, 0.45)",
    accentClass: "from-blue-900/10 via-slate-900/20 to-background",
  },
  spidergwen: {
    name: "Spider-Gwen Neon",
    image: "/themes/spidergwen.jpg",
    glow1: "rgba(244, 114, 182, 0.14)",
    glow2: "rgba(6, 182, 212, 0.12)",
    accentClass: "from-pink-900/10 via-cyan-900/15 to-background",
  },
  medical: {
    name: "Medical Neutral Glass",
    image: "/themes/medical.jpg",
    glow1: "rgba(16, 185, 129, 0.12)",
    glow2: "rgba(6, 182, 212, 0.10)",
    accentClass: "from-emerald-900/8 via-teal-900/10 to-background",
  },
};

export function DynamicBackground({ initialTheme = "medical" }: DynamicBackgroundProps) {
  const [theme, setTheme] = useState<AnimationTheme>(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medvault_animation_theme") as AnimationTheme | null;
      if (saved && (saved === "batman" || saved === "spidergwen" || saved === "medical")) {
        setTheme(saved);
      } else if (initialTheme) {
        setTheme(initialTheme);
      }
    } catch {
      // Storage unavailable
    }
    setMounted(true);
  }, [initialTheme]);

  // Listen for custom theme change events across windows/settings
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("medvault_animation_theme") as AnimationTheme | null;
      if (saved && (saved === "batman" || saved === "spidergwen" || saved === "medical")) {
        setTheme(saved);
      }
    };
    window.addEventListener("medvault_theme_change", handleStorage);
    return () => window.removeEventListener("medvault_theme_change", handleStorage);
  }, []);

  const config = THEME_CONFIG[theme] || THEME_CONFIG.medical;

  if (!mounted) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden select-none"
    >
      {/* Cinematic Wallpaper Backdrop with soft blur & opacity */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30 transition-opacity duration-700 ease-in-out scale-105">
        <Image
          src={config.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter blur-[1px]"
        />
      </div>

      {/* Ambient Gradient Wash for Readability */}
      <div className={`absolute inset-0 bg-gradient-to-b ${config.accentClass} backdrop-blur-[2px]`} />

      {/* Floating Animated Ambient Glow Orbs */}
      <div
        className="absolute top-[-10%] left-[15%] w-[45vw] h-[45vw] rounded-full blur-[100px] animate-pulse"
        style={{
          background: `radial-gradient(circle, ${config.glow1} 0%, transparent 70%)`,
          animationDuration: "9s",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-pulse"
        style={{
          background: `radial-gradient(circle, ${config.glow2} 0%, transparent 70%)`,
          animationDuration: "12s",
          animationDelay: "3s",
        }}
      />

      {/* Floating Dust / Bokeh Spec Particles */}
      <div className="absolute inset-0 bg-dot-grid-light opacity-30" />
    </div>
  );
}
