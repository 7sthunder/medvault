import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Settings } from "lucide-react";
import { NAV_ITEMS, CAREGIVER_NAV_ITEMS, NAV_GROUP_ORDER, type NavGroup, type NavItem } from "@/shared/nav";
import { NavIcon } from "@/components/ui/nav-icon";
import { Brand } from "@/components/brand/Brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, type ProfileMenuUser } from "@/components/layout/ProfileMenu";
import { useI18n } from "@/lib/i18n/context";
import { useAnimationTheme } from "@/components/theme/DynamicBackground";
import { VoiceAssistantDrawer } from "@/features/voice/VoiceAssistantDrawer";
import { cn } from "@/lib/utils";

const GROUP_TITLES: Record<NavGroup, string> = {
  overview: "Overview",
  management: "Management",
  intelligence: "Intelligence",
  care: "Care",
  bottom: "System",
};

export interface SidebarProps {
  user?: ProfileMenuUser | null;
  className?: string;
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { theme } = useAnimationTheme();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const isCaregiver = user?.role === "caregiver";
  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  // Select navigation list depending on role
  const navSource = isCaregiver ? CAREGIVER_NAV_ITEMS : NAV_ITEMS;

  // Group items
  const itemsByGroup = NAV_GROUP_ORDER.reduce<Record<NavGroup, NavItem[]>>((acc, group) => {
    acc[group] = navSource.filter((item) => item.group === group);
    return acc;
  }, {} as Record<NavGroup, NavItem[]>);

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/caregiver") {
      return pathname === "/caregiver";
    }
    return pathname.startsWith(href);
  };

  const themeConfig = {
    batman: {
      aside: "bg-slate-950/85 border-cyan-500/20 shadow-[4px_0_30px_rgba(6,182,212,0.12)] text-slate-100 backdrop-blur-2xl",
      border: "border-cyan-500/20",
      active: "bg-cyan-500/15 text-cyan-300 border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.2)] font-bold",
      indicator: "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]",
      iconActive: "text-cyan-400",
      hover: "hover:bg-cyan-500/10 hover:text-cyan-200 hover:border-cyan-500/20 hover:scale-[1.02] hover:-translate-y-0.5",
      brandAccent: "text-cyan-400",
      voiceBtn: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      voicePing: "bg-cyan-400/40",
      voiceWave: "bg-cyan-400",
    },
    spidergwen: {
      aside: "bg-slate-950/85 border-pink-500/20 shadow-[4px_0_30px_rgba(244,114,182,0.12)] text-slate-100 backdrop-blur-2xl",
      border: "border-pink-500/20",
      active: "bg-pink-500/15 text-pink-300 border-pink-500/35 shadow-[0_0_15px_rgba(244,114,182,0.2)] font-bold",
      indicator: "bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.8)]",
      iconActive: "text-pink-400",
      hover: "hover:bg-pink-500/10 hover:text-pink-200 hover:border-pink-500/20 hover:scale-[1.02] hover:-translate-y-0.5",
      brandAccent: "text-pink-400",
      voiceBtn: "border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:shadow-[0_0_15px_rgba(244,114,182,0.3)]",
      voicePing: "bg-pink-400/40",
      voiceWave: "bg-pink-400",
    },
    medical: {
      aside: "bg-slate-900/85 border-emerald-500/20 shadow-[4px_0_30px_rgba(16,185,129,0.12)] text-slate-100 backdrop-blur-2xl",
      border: "border-emerald-500/20",
      active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold",
      indicator: "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]",
      iconActive: "text-emerald-400",
      hover: "hover:bg-emerald-500/10 hover:text-emerald-200 hover:border-emerald-500/20 hover:scale-[1.02] hover:-translate-y-0.5",
      brandAccent: "text-emerald-400",
      voiceBtn: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      voicePing: "bg-emerald-400/40",
      voiceWave: "bg-emerald-400",
    },
  }[theme] || {
    aside: "bg-slate-900/85 border-border shadow-sm text-slate-100 backdrop-blur-2xl",
    border: "border-border",
    active: "bg-primary/15 text-primary-300 border-primary/35 font-bold",
    indicator: "bg-primary",
    iconActive: "text-primary",
    hover: "hover:bg-muted/70 hover:text-white hover:scale-[1.02] hover:-translate-y-0.5",
    brandAccent: "text-primary",
    voiceBtn: "border-primary/30 bg-primary/10 text-primary-300 hover:bg-primary/20",
    voicePing: "bg-primary/40",
    voiceWave: "bg-primary",
  };

  return (
    <>
      <aside
        aria-label="Sidebar navigation"
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-30 flex flex-col border-r",
          "w-16 hover:w-64 transition-all duration-300 ease-in-out overflow-x-hidden",
          themeConfig.aside,
          className,
        )}
      >
        {/* Brand Header */}
        <div className={cn("flex h-16 shrink-0 items-center px-3.5 border-b", themeConfig.border)}>
          <Link
            href={isCaregiver ? "/caregiver" : "/dashboard"}
            className="flex items-center gap-3 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="MedVault home"
          >
            <div className="shrink-0">
              <Brand size={36} showWordmark={false} href={null} />
            </div>
            <div className="flex flex-col opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <span className="font-heading font-extrabold text-lg text-white leading-tight">
                Med<span className={isCaregiver ? "text-secondary" : themeConfig.brandAccent}>Vault</span>
              </span>
              {isCaregiver && (
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Caregiver Hub
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Nav Link Groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5" aria-label="Main menu">
          {NAV_GROUP_ORDER.map((group) => {
            const items = itemsByGroup[group];
            if (!items || items.length === 0) return null;

            return (
              <div key={group} className="space-y-1">
                <div
                  className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 pointer-events-none truncate"
                  aria-hidden="true"
                >
                  {GROUP_TITLES[group]}
                </div>

                {items.map((item) => {
                  const active = isItemActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-200 group/link border",
                        active
                          ? isCaregiver
                            ? "bg-secondary/15 text-secondary dark:bg-secondary/25 font-bold shadow-xs border-secondary/30"
                            : themeConfig.active
                          : cn(
                              "text-slate-300 border-transparent",
                              themeConfig.hover,
                            ),
                      )}
                    >
                      {active && (
                        <span
                          className={cn(
                            "absolute left-0 top-2 bottom-2 w-1 rounded-r-full",
                            isCaregiver
                              ? "bg-secondary shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                              : themeConfig.indicator,
                          )}
                          aria-hidden="true"
                        />
                      )}
                      <div className="shrink-0 flex items-center justify-center size-5">
                        <NavIcon
                          name={item.icon}
                          className={cn(
                            "size-5 transition-colors",
                            active
                              ? isCaregiver
                                ? "text-secondary"
                                : themeConfig.iconActive
                              : "text-slate-400 group-hover/link:text-white",
                          )}
                        />
                      </div>
                      <span className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        {t(`nav.${item.href.replace("/", "")}`, item.label)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Voice Assistant Button for Patient Sidebar */}
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            aria-label="Open voice assistant"
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-all duration-300 group/voice w-full border",
              themeConfig.voiceBtn,
              "hover:scale-[1.02] hover:-translate-y-0.5",
            )}
          >
            <div className="relative shrink-0 flex items-center justify-center size-5">
              <span className={cn("absolute -inset-1 rounded-full animate-ping opacity-60", themeConfig.voicePing)} />
              <Mic className="size-5 relative z-10" />
            </div>
            <div className="flex items-center justify-between w-full opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              <span className="truncate">{t("voice.assistantTitle", "Voice Assistant")}</span>
              <span className="flex items-center gap-0.5 pr-1">
                <span className={cn("w-0.5 h-2.5 animate-pulse rounded-full", themeConfig.voiceWave)} />
                <span className={cn("w-0.5 h-4 animate-pulse rounded-full [animation-delay:150ms]", themeConfig.voiceWave)} />
                <span className={cn("w-0.5 h-2 animate-pulse rounded-full [animation-delay:300ms]", themeConfig.voiceWave)} />
              </span>
            </div>
          </button>
        </div>

        {/* Footer User Info */}
        <div className={cn("shrink-0 border-t p-2.5", themeConfig.border)}>
          <Link
            href="/settings/profile"
            className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/10 transition-colors group/user focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`View profile for ${displayName}`}
          >
            <Avatar size="default" className="size-8 shrink-0 border border-white/20">
              <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 truncate">
              <p className="text-xs font-semibold text-white truncate">
                {displayName}
              </p>
              {displayEmail && (
                <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
              )}
            </div>
            <Settings className="size-4 shrink-0 text-slate-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {/* Voice Assistant Interactive Drawer */}
      {voiceOpen && <VoiceAssistantDrawer open={voiceOpen} onClose={() => setVoiceOpen(false)} />}
    </>
  );
}
