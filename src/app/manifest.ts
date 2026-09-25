import type { MetadataRoute } from "next";

import { BRAND } from "@/shared/brand";

/**
 * Web app manifest. Required for an installable PWA on Android/Chrome, and it gives the push
 * notification an icon + name to render with.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — AI Smart Medical Adherence & Tracker`,
    short_name: BRAND.name,
    description: "Medication schedules, dose reminders and AI health guidance in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
