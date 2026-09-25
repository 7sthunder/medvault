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

/* Port of `App.jsx:1150–1219` (Footer). Dark `ink-900` surface; logo lockup hand-built
   (`.footer-brand-label` white text) because `Wordmark` is fixed `text-ink-900`. */
function FooterBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Logo size={38} />
      <span className="footer-brand-label">{BRAND.name}</span>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      className="bg-ink-900 text-white"
      style={{ padding: "80px 6% 36px", borderTopLeftRadius: 48, borderTopRightRadius: 48 }}
    >
      <div className="flex flex-wrap gap-16">
        <div style={{ flex: "1 1 300px", minWidth: 260 }}>
          <FooterBrand />
          <p className="text-white/70 mt-6 text-sm" style={{ lineHeight: 1.7, maxWidth: 300 }}>
            Your complete medical history, medications, and AI-powered insights — safe in one secure
            vault. Hold your health story in your hands.
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title} style={{ flex: "1 1 180px" }}>
            <div className="text-white/85 mb-6 text-base font-bold">{col.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {col.links.map((l) => (
                <a key={l.label} href={l.href} className="footer-link">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}

        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          <div className="text-white/85 mb-6 text-base font-bold">Contact</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {CONTACT_ROWS.map((r, i) => {
              const Icon = r.icon;
              return r.href ? (
                <a
                  key={i}
                  href={r.href}
                  className="flex items-center gap-3 text-sm text-white/75 transition-colors duration-300 hover:text-white"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon size={17} className="text-primary" />
                  </span>
                  <span className="break-all">{r.text}</span>
                </a>
              ) : (
                <div key={i} className="flex items-center gap-3 text-sm text-white/75">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon size={17} className="text-primary" />
                  </span>
                  <span className="break-all">{r.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10" style={{ margin: "60px 0 28px" }} />

      <div className="text-white/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span>© 2026 {BRAND.name}. All rights reserved.</span>
        <span>
          Made with <span className="text-primary">💚</span> for your health ·{" "}
          <span className="text-white/70">Privacy-first</span>
        </span>
      </div>
    </footer>
  );
}
