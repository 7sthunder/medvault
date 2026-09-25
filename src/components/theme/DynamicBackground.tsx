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
    glow1: "rgba(59, 130, 246, 0.35)",
    glow2: "rgba(14, 165, 233, 0.25)",
    accentClass: "from-slate-950/40 via-blue-950/20 to-transparent",
  },
  spidergwen: {
    name: "Spider-Gwen Neon",
    image: "/themes/spidergwen.jpg",
    glow1: "rgba(244, 114, 182, 0.40)",
    glow2: "rgba(6, 182, 212, 0.30)",
    accentClass: "from-purple-950/35 via-pink-950/15 to-transparent",
  },
  medical: {
    name: "Medical Neutral Glass",
    image: "/themes/medical.jpg",
    glow1: "rgba(16, 185, 129, 0.30)",
    glow2: "rgba(6, 182, 212, 0.25)",
    accentClass: "from-emerald-950/30 via-teal-950/15 to-transparent",
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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Cinematic Wallpaper Backdrop with rich visual clarity */}
      <div className="absolute inset-0 opacity-75 dark:opacity-65 transition-opacity duration-700 ease-in-out scale-100">
        <Image
          src={config.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Subtle Ambient Gradient Wash to Ensure Content Readability */}
      <div className={`absolute inset-0 bg-gradient-to-b ${config.accentClass} backdrop-blur-[0.5px]`} />

      {/* Floating Animated Ambient Glow Orbs */}
      <div
        className="absolute top-[-10%] left-[15%] w-[45vw] h-[45vw] rounded-full blur-[90px] animate-pulse"
        style={{
          background: `radial-gradient(circle, ${config.glow1} 0%, transparent 70%)`,
          animationDuration: "8s",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full blur-[110px] animate-pulse"
        style={{
          background: `radial-gradient(circle, ${config.glow2} 0%, transparent 70%)`,
          animationDuration: "11s",
          animationDelay: "2s",
        }}
      />

      {/* Floating Dust / Bokeh Spec Particles */}
      <div className="absolute inset-0 bg-dot-grid-light opacity-25" />
    </div>
  );
}
