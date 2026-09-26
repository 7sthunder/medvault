"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Brand } from "@/components/brand/Brand";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const SECTION_LINKS = [
  { label: "Home", id: "hero" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Contact", id: "contact" },
];

/* Port of `App.jsx:694–747`. `#auth` view-switch replaced with real `/login` `/register`
   links (§10 port list). Center links stay buttons (same-page anchor scroll, offset -80px);
   hidden below `md` (768) per Stitch's `window.innerWidth < 768` behaviour — and, unlike the
   original, the section links are still reachable there via the mobile drawer rather than
   simply disappearing. */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        "fixed inset-x-0 top-0 z-[200] flex h-[68px] items-center justify-between gap-2 border-b border-border px-4 transition-all duration-300 sm:px-[4%]",
        scrolled
          ? "bg-white/95 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-[16px]"
          : "bg-white",
      )}
    >
      {/* Below `sm` the wordmark is dropped (the logo tile keeps the brand's accessible name, so
          the lockup still reads as "MediTrack AI" to a screen reader). That reclaims ~100px,
          which is what lets "Log In" + "Create Vault" + the drawer trigger coexist down to a
          320px viewport — they are not duplicated into the drawer for that reason. */}
      <Brand size={36} wordmarkSize={20} wordmarkClassName="hidden sm:inline" className="min-w-0" />

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

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerClose
            render={
              <button
                type="button"
                aria-label="Open navigation menu"
                className="tap-target -mr-1 flex size-10 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-muted md:hidden"
              />
            }
          >
            <Menu className="size-5" aria-hidden />
          </DrawerClose>
          <DrawerContent className="md:hidden">
            <DrawerHandle />
            <DrawerHeader className="text-left">
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>Jump to a section of this page.</DrawerDescription>
            </DrawerHeader>
            <nav aria-label="Sections" className="grid gap-1 overflow-y-auto pb-2">
              {SECTION_LINKS.map((l) => (
                <DrawerClose
                  key={l.id}
                  render={
                    <button
                      type="button"
                      onClick={() => scrollToSection(l.id)}
                      className="tap-target-y flex w-full items-center rounded-lg px-3 text-left text-base font-semibold text-ink-700 transition-colors hover:bg-muted hover:text-ink-900"
                    />
                  }
                >
                  {l.label}
                </DrawerClose>
              ))}
            </nav>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
