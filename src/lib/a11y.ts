/**
 * Phase 26 — Accessibility & Reduced Motion utilities (plan §15, §16).
 *
 * Provides:
 * - Hybrid reduced-motion hook (OS preference + user setting)
 * - Accessible status formatters
 * - Screen reader announcements (live region dispatch)
 * - Standardized focus ring and visually-hidden classes
 */

"use client";

import { useEffect, useState } from "react";
import type { DoseStatus } from "@/shared/enums";

export const visuallyHiddenClass = "sr-only";

export const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export const skipLinkClass =
  "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:font-semibold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

/**
 * Hybrid reduced-motion hook that honors:
 * 1. OS media query: `(prefers-reduced-motion: reduce)`
 * 2. In-app DOM attribute: `html[data-reduce-motion="true"]`
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const checkReduced = () => {
      const isSystemReduced = mediaQuery.matches;
      const isDomReduced =
        document.documentElement.getAttribute("data-reduce-motion") === "true";
      setPrefersReduced(isSystemReduced || isDomReduced);
    };

    checkReduced();

    // Listen to OS changes
    mediaQuery.addEventListener("change", checkReduced);

    // Mutation observer for data-reduce-motion attribute changes on <html>
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-reduce-motion") {
          checkReduced();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduce-motion"],
    });

    return () => {
      mediaQuery.removeEventListener("change", checkReduced);
      observer.disconnect();
    };
  }, []);

  return prefersReduced;
}

/**
 * Format accessible dose event status string for screen readers.
 */
export function formatAccessibleDoseStatus(
  status: DoseStatus,
  medicationName: string,
  scheduledTime?: string,
): string {
  const timeContext = scheduledTime ? ` scheduled for ${scheduledTime}` : "";

  switch (status) {
    case "taken":
      return `${medicationName}${timeContext}: Taken as prescribed.`;
    case "missed":
      return `${medicationName}${timeContext}: Missed dose. Action required.`;
    case "skipped":
      return `${medicationName}${timeContext}: Skipped.`;
    case "snoozed":
      return `${medicationName}${timeContext}: Temporarily snoozed.`;
    case "due-now":
      return `${medicationName}${timeContext}: Due now. Please take dose.`;
    case "upcoming":
      return `${medicationName}${timeContext}: Upcoming.`;
    case "paused":
      return `${medicationName}${timeContext}: Paused.`;
    case "canceled":
      return `${medicationName}${timeContext}: Canceled.`;
    default:
      return `${medicationName}${timeContext}: Status ${status}.`;
  }
}

/**
 * Dispatches an accessible message to the global live region for screen readers.
 */
export function announceToLiveRegion(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  if (typeof document === "undefined") return;

  const elementId =
    priority === "assertive"
      ? "aria-live-assertive-region"
      : "aria-live-polite-region";

  let region = document.getElementById(elementId);

  if (!region) {
    region = document.createElement("div");
    region.id = elementId;
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.className = "sr-only";
    document.body.appendChild(region);
  }

  // Clear and update to force screen reader announcement
  region.textContent = "";
  setTimeout(() => {
    if (region) {
      region.textContent = message;
    }
  }, 50);
}
