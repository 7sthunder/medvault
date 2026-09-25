import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "@/lib/trpc";
import { I18nProvider } from "@/lib/i18n/context";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MedVault — AI Smart Medical Adherence & Tracker",
    template: "%s · MedVault",
  },
  description:
    "MediTrack AI (MedVault) — AI-powered medical adherence tracking: schedules, doses, insights, and caregiver oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <TRPCProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </TRPCProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}