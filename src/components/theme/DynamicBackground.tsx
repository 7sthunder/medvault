"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type AnimationTheme = "batman" | "spidergwen" | "medical" | "plain";

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
  plain: {
    name: "Minimalist Plain White",
    image: "",
    glow1: "transparent",
    glow2: "transparent",
    accentClass: "from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
  },
};

export function useAnimationTheme(initial: AnimationTheme = "medical") {
  const [theme, setThemeState] = useState<AnimationTheme>(initial);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medvault_animation_theme") as AnimationTheme | null;
      if (saved && (saved === "batman" || saved === "spidergwen" || saved === "medical" || saved === "plain")) {
        setThemeState(saved);
      }
    } catch {
      // Storage unavailable
    }

    const handleStorage = () => {
      try {
        const saved = localStorage.getItem("medvault_animation_theme") as AnimationTheme | null;
        if (saved && (saved === "batman" || saved === "spidergwen" || saved === "medical" || saved === "plain")) {
          setThemeState(saved);
        }
      } catch {
        // Storage unavailable
      }
    };
    window.addEventListener("medvault_theme_change", handleStorage);
    return () => window.removeEventListener("medvault_theme_change", handleStorage);
  }, []);

  const setTheme = (newTheme: AnimationTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("medvault_animation_theme", newTheme);
      window.dispatchEvent(new Event("medvault_theme_change"));
    } catch {
      // Storage unavailable
    }
  };

  return { theme, setTheme };
}

interface DynamicBackgroundProps {
  initialTheme?: AnimationTheme;
  forceTheme?: AnimationTheme;
  className?: string;
}

export function DynamicBackground({ initialTheme = "medical", forceTheme }: DynamicBackgroundProps) {
  const { theme: activeTheme } = useAnimationTheme(forceTheme || initialTheme);
  const theme = forceTheme || activeTheme;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = THEME_CONFIG[theme] || THEME_CONFIG.medical;

  if (!mounted) {
    return null;
  }

  // Minimalist Clean White Theme: Pure crisp canvas with zero distracting animations or heavy wallpapers
  if (theme === "plain") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/40 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950" />
        <div className="absolute inset-0 bg-dot-grid-light opacity-15 dark:opacity-10" />
      </div>
    );
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
