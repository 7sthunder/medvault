"use client";

import { motion } from "framer-motion";
import { Pill, BellRing, HeartPulse, Clock, type LucideIcon } from "lucide-react";

import PhoneMockup from "@/features/landing/PhoneMockup";

type Tone = "primary" | "red" | "blue" | "violet";

const TONE_VAR: Record<Tone, string> = {
  primary: "var(--color-primary)",
  red: "var(--color-red)",
  blue: "var(--color-blue)",
  violet: "var(--color-violet)",
};

/* Port of `Landingpage/src/components/HeroVisual.jsx` FloatingNotification.
   Chip tint `${color}18` (≈9.4%) + icon colour express via the tone var; the card
   outline is `--glass-border` (rgba primary 0.28). */
function FloatingNotification({
  icon: Icon,
  title,
  subtitle,
  time,
  tone = "primary",
  delay = 0,
  scale = 1,
  width = "200px",
  style,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  time?: string;
  tone?: Tone;
  delay?: number;
  scale?: number;
  width?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 * scale, y: 30 }}
      animate={{ opacity: 1, scale, y: [0, -12, 0] }}
      transition={{
        opacity: { duration: 0.8, delay },
        scale: { duration: 0.8, delay, type: "spring", stiffness: 100 },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay },
      }}
      className="z-20 flex items-center gap-[14px] rounded-[22px] border border-primary/[0.28] bg-white/90 px-[18px] py-[14px] shadow-[0_15px_40px_rgba(15,23,42,0.1),0_5px_15px_rgba(15,23,42,0.04)] backdrop-blur-[14px]"
      style={{
        position: "absolute",
        minWidth: width,
        ...style,
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "14px",
          background: `color-mix(in srgb, ${TONE_VAR[tone]} 9.4%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={22} style={{ color: TONE_VAR[tone] }} />
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-ink-900)", whiteSpace: "nowrap" }}>
          {title}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-ink-500)", marginTop: "1px" }}>{subtitle}</div>
      </div>
      {time && (
        <div style={{ fontSize: "10px", color: "var(--color-ink-400)", alignSelf: "flex-start", marginTop: "3px" }}>
          {time}
        </div>
      )}
    </motion.div>
  );
}

export default function HeroVisual({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return <div className="hero-visual-container" />;

  return (
    <div className="hero-visual-container">
      <FloatingNotification
        icon={Pill}
        title="Medication Reminder"
        subtitle="Time for Vitamin D3"
        time="10:00 AM"
        tone="primary"
        style={{ top: "12%", left: "-22%" }}
        scale={1.15}
        width="230px"
        delay={0.4}
      />
      <FloatingNotification
        icon={HeartPulse}
        title="Vitals Tracked"
        subtitle="Resting HR: 68bpm"
        time="Just now"
        tone="red"
        style={{ bottom: "22%", left: "-15%" }}
        delay={1.0}
      />
      <FloatingNotification
        icon={Clock}
        title="Upcoming Visit"
        subtitle="Dr. Sharma - Cardiology"
        time="2:30 PM"
        tone="blue"
        style={{ top: "42%", right: "-24%" }}
        scale={1.12}
        width="220px"
        delay={1.3}
      />
      <FloatingNotification
        icon={BellRing}
        title="Report Ready"
        subtitle="Blood Analysis Lab"
        tone="violet"
        style={{ top: "8%", right: "-12%" }}
        delay={0.7}
      />

      <PhoneMockup isVisible={isVisible} />
    </div>
  );
}