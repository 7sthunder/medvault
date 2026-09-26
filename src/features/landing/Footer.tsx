import { CalendarCheck2, MapPin, MessageCircleHeart } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/shared/brand";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "AI Insights", href: "#features" },
      { label: "Try the Demo", href: "/demo" },
      { label: "Reviews", href: "#testimonials" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#hero" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "FAQs", href: "/help" },
      { label: "Report Issue", href: "/report" },
      { label: "Status", href: "/status" },
    ],
  },
];

const CONTACT_ROWS = [
  { icon: CalendarCheck2, text: "+1 (000) 000-0000", href: "tel:+10000000000" },
  {
    icon: MessageCircleHeart,
    text: "hello@meditrackai.example",
    href: "mailto:hello@meditrackai.example",
  },
  { icon: MapPin, text: "123 Health St, MedVille, MV 00000", href: undefined },
];

/* Port of `App.jsx:1150–1219` (Footer). Rebuilt for floating, premium SaaS look. */
function FooterBrand() {
  return (
    <div className="flex items-center gap-3">
      <Logo size={36} />
      <span className="text-ink-900 text-xl font-bold tracking-tight">{BRAND.name}</span>
    </div>
  );
}

export default function Footer() {
  return (
    <div className="px-4 md:px-8 pb-8 md:pb-10 pt-4">
      <footer className="mx-auto max-w-[1400px] rounded-[36px] border border-teal-900/10 bg-[#E5F2F0] px-6 py-10 md:px-12 md:py-12 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 justify-between">
          {/* Brand & Contact Section */}
          <div className="flex flex-col gap-8 lg:w-1/3">
            <div>
              <FooterBrand />
              <p className="mt-5 text-sm leading-relaxed text-slate-500 max-w-xs">
                Your complete medical history, medications, and AI-powered insights — safe in one
                secure vault. Hold your health story in your hands.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {CONTACT_ROWS.map((r, i) => {
                const Icon = r.icon;
                return r.href ? (
                  <a
                    key={i}
                    href={r.href}
                    className="flex items-center gap-3 text-sm text-slate-500 transition-colors hover:text-ink-900"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-teal-900/5 shadow-sm">
                      <Icon size={18} className="text-primary" />
                    </span>
                    <span className="break-all">{r.text}</span>
                  </a>
                ) : (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-teal-900/5 shadow-sm">
                      <Icon size={18} className="text-primary" />
                    </span>
                    <span className="break-all">{r.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap gap-10 lg:gap-16 lg:w-2/3 lg:justify-end mt-4 lg:mt-0">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="min-w-[140px]">
                <div className="mb-6 text-sm font-bold text-ink-900 uppercase tracking-wider">
                  {col.title}
                </div>
                <div className="flex flex-col gap-4">
                  {col.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="text-sm text-slate-500 transition-colors hover:text-primary font-medium"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-teal-900/10" />

        {/* Copyright & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <span>© 2026 {BRAND.name}. All rights reserved.</span>
          <span>
            Made with <span className="text-primary">💚</span> for your health ·{" "}
            <span className="font-medium text-slate-600">Privacy-first</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
