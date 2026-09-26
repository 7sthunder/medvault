import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/shared/brand";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — AI Smart Medical Adherence & Tracker`,
    template: `%s · ${BRAND.name}`,
  },
  description: `${BRAND.name} brings your medical records, medicine schedules, appointments, and AI-powered health guidance into one beautifully simple, secure platform.`,
};

/**
 * Next.js 15 splits viewport concerns out of `metadata`. Without this export the project relies on
 * Next's implicit `width=device-width, initial-scale=1`; declaring it explicitly makes the mobile
 * contract reviewable and lets us opt into the two things that actually matter on a phone:
 * - `viewportFit: "cover"` so the safe-area padding helpers in `globals.css` have room to work
 *   (notched devices otherwise letterbox the app).
 * - per-scheme `themeColor` so the browser UI matches the active surface. The media queries are
 *   plain CSS, so the right colour is applied before hydration — no flash, and it stays correct
 *   because `globals.css:175` drives the theme off the same `prefers-color-scheme` media query.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never cap zoom: pinch-to-must-zoom is an accessibility failure (WCAG 1.4.4), and capping
  // initialScale is a known trigger for iOS Safari's auto-zoom-on-focus for form inputs.
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
