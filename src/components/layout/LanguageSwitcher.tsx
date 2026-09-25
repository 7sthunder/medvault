"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "minimal" | "compact";
}

export function LanguageSwitcher({ className, variant = "pill" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) ?? SUPPORTED_LANGUAGES[0]!;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl transition-all duration-200 select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          variant === "pill" &&
            "bg-white/90 dark:bg-card/90 hover:bg-muted/80 border border-border px-3 py-1.5 text-xs font-semibold shadow-xs backdrop-blur-md text-ink-700 dark:text-ink-200",
          variant === "minimal" &&
            "hover:bg-muted/60 p-2 text-ink-600 dark:text-ink-300 rounded-lg",
          variant === "compact" &&
            "px-2 py-1 text-xs font-medium border border-border/60 rounded-lg hover:bg-muted/70",
        )}
      >
        <Globe className="size-4 text-primary shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline font-medium">{activeOption.nativeLabel}</span>
        <span className="sm:hidden font-medium uppercase">{activeOption.code}</span>
        <ChevronDown
          className={cn("size-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-border shadow-xl ring-1 ring-black/5 dark:ring-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
            Select Language
          </div>
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors text-left",
                  isSelected
                    ? "bg-primary/10 text-primary dark:text-primary-tint font-bold"
                    : "text-ink-700 dark:text-ink-200 hover:bg-muted/80",
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{opt.flag}</span>
                  <div>
                    <div className="leading-tight">{opt.nativeLabel}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{opt.label}</div>
                  </div>
                </div>
                {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
