import type { Metadata } from "next";
import { HelpCircle, Phone } from "lucide-react";

export const metadata: Metadata = { title: "Help & Support · MedVault" };

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
          Help & Support
        </h1>
        <p className="text-sm text-muted-foreground">
          Guides, frequently asked questions, and emergency medical contacts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-tint text-primary">
            <HelpCircle className="size-5" />
          </div>
          <h2 className="font-heading font-bold text-base text-ink-900 dark:text-ink-100">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Learn how dose tracking, caregiver alerts, and offline sync operate in MedVault.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary-tint text-secondary">
            <Phone className="size-5" />
          </div>
          <h2 className="font-heading font-bold text-base text-ink-900 dark:text-ink-100">
            Support & Medical Emergencies
          </h2>
          <p className="text-sm text-muted-foreground">
            If you are experiencing a medical emergency, call your local emergency services (911 / 112) immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
