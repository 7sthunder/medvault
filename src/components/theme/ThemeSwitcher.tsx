"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Check, ChevronDown } from "lucide-react";
import { type AnimationTheme } from "./DynamicBackground";
import { cn } from "@/lib/utils";

export interface ThemeSwitcherProps {
  className?: string;
}

export const THEME_OPTIONS: { id: AnimationTheme; label: string; icon: string; tag: string }[] = [
  { id: "batman", label: "Batman Dark Knight", icon: "🦇", tag: "Male < 27" },
  { id: "spidergwen", label: "Spider-Gwen Neon", icon: "🕸️", tag: "Female < 27" },
  { id: "medical", label: "Medical Neutral Glass", icon: "🔬", tag: "Age 28+" },
];

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<AnimationTheme>("medical");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medvault_animation_theme") as AnimationTheme | null;
      if (saved && (saved === "batman" || saved === "spidergwen" || saved === "medical")) {
        setTheme(saved);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newTheme: AnimationTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
    try {
      localStorage.setItem("medvault_animation_theme", newTheme);
      window.dispatchEvent(new Event("medvault_theme_change"));
    } catch {
      // Storage unavailable
    }
  };

  const active = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[2]!;

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Change animation theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 dark:bg-card/90 hover:bg-muted/80 border border-border px-3 py-1.5 text-xs font-semibold shadow-xs backdrop-blur-md text-ink-700 dark:text-ink-200 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="text-sm leading-none" aria-hidden="true">{active.icon}</span>
        <span className="hidden sm:inline font-bold">{active.label.split(" ")[0]}</span>
        <ChevronDown
          className={cn("size-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-border shadow-xl ring-1 ring-black/5 dark:ring-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 flex items-center gap-1.5">
            <Sparkles className="size-3 text-secondary" />
            <span>Animation Theme</span>
          </div>

          {THEME_OPTIONS.map((opt) => {
            const isSelected = opt.id === theme;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors text-left",
                  isSelected
                    ? "bg-secondary/15 text-secondary dark:text-secondary-tint font-bold"
                    : "text-ink-700 dark:text-ink-200 hover:bg-muted/80",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{opt.icon}</span>
                  <div>
                    <div className="leading-tight font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.tag}</div>
                  </div>
                </div>
                {isSelected && <Check className="size-3.5 text-secondary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
