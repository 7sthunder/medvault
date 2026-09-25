"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Brand } from "@/components/brand/Brand";
import { cn } from "@/lib/utils";

const SECTION_LINKS = [
  { label: "Home", id: "hero" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Contact", id: "contact" },
];

/* Port of `App.jsx:694–747`. `#auth` view-switch replaced with real `/login` `/register`
   links (§10 port list). Center links stay buttons (same-page anchor scroll, offset -80px);
   hidden below `md` (768) per Stitch's `window.innerWidth < 768` behaviour. */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 top-0 z-[200] flex h-[68px] items-center justify-between border-b border-border px-[4%] transition-all duration-300",
        scrolled
          ? "bg-white/95 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-[16px]"
          : "bg-white",
      )}
    >
      <Brand size={36} wordmarkSize={20} />

      <div className="hidden items-center gap-2 md:flex">
        {SECTION_LINKS.map((l) => (
          <button
            key={l.id}
            type="button"
            className="nav-link"
            onClick={() => scrollToSection(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login" className="nav-login">
          Log In
        </Link>
        <Link
          href="/register"
          className="cta-primary"
          style={{ padding: "10px 22px", fontSize: 13.5 }}
        >
          Create Vault
        </Link>
      </div>
    </nav>
  );
}
