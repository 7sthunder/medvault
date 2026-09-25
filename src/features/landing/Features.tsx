"use client";

import { motion } from "framer-motion";
import { FolderHeart, Pill, Hospital } from "lucide-react";

import { useInView } from "@/features/landing/use-in-view";
import { BRAND } from "@/shared/brand";

/* Port of `App.jsx:338–538` (F1 medical records, F2 smart reminders, F3 find care) plus
   the three feature blocks (`App.jsx:957–1070`). All inline brand colours migrated to
   tokens (classes); framer-motion shadow/blur keyframes keep their literal composite
   strings (lint-safe: they do not begin with `#` or `rgba(`). */

function FeatureMedicalRecords() {
  return (
    <div
      style={{
        position: "relative",
        width: 400,
        height: 420,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
      }}
    >
      <motion.div
        animate={{
          opacity: [0, 1, 1, 0, 0],
          filter: ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)", "blur(12px)"],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          times: [0, 0.05, 0.88, 0.95, 1],
          ease: "easeInOut",
        }}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <motion.div
          animate={{ y: [60, -40, -40] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.15, 1], ease: "easeOut" }}
          className="absolute border border-white/40 bg-white/40 backdrop-blur-[10px]"
          style={{ width: 310, height: 200, borderRadius: 20, top: 100 }}
        />
        <motion.div
          animate={{ y: [60, -10, -10] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.18, 1], ease: "easeOut" }}
          className="absolute border border-white/50 bg-white/60 backdrop-blur-[12px]"
          style={{ width: 340, height: 220, borderRadius: 24, top: 110 }}
        />
        <motion.div
          animate={{
            y: [60, 20, 20],
            scale: [0.95, 1.05, 1.05],
            boxShadow: [
              "0 24px 48px rgba(0,0,0,0.06)",
              "0 32px 64px rgba(0,0,0,0.12)",
              "0 32px 64px rgba(0,0,0,0.12)",
            ],
          }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.22, 1], ease: "easeOut" }}
          className="absolute flex flex-col border border-primary/20 bg-white/95 backdrop-blur-[16px]"
          style={{ width: 380, height: 270, borderRadius: 28, top: 100, padding: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-tint">
              <FolderHeart size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="bg-border mb-[10px] h-4 rounded-md" style={{ width: 140 }} />
              <div className="bg-bg-soft h-3 rounded-md" style={{ width: 100 }} />
            </div>
          </div>
          <div className="bg-bg-soft h-px" style={{ margin: "8px 0 16px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <motion.div
              animate={{ width: ["0%", "100%", "100%"] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0.1, 0.35, 1],
                ease: "easeOut",
              }}
              className="bg-background h-3 rounded-md"
            />
            <motion.div
              animate={{ width: ["0%", "85%", "85%"] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0.15, 0.4, 1],
                ease: "easeOut",
              }}
              className="bg-background h-3 rounded-md"
            />
            <motion.div
              animate={{ width: ["0%", "60%", "60%"] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0.2, 0.45, 1],
                ease: "easeOut",
              }}
              className="bg-background h-3 rounded-md"
            />
            <motion.div
              animate={{ width: ["0%", "75%", "75%"] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0.25, 0.5, 1],
                ease: "easeOut",
              }}
              className="bg-background h-3 rounded-md"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureSmartReminders() {
  const scrollItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div
      style={{
        position: "relative",
        width: 340,
        height: 400,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
      }}
    >
      <motion.div
        animate={{
          opacity: [0, 1, 1, 0, 0],
          filter: ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)", "blur(12px)"],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          times: [0, 0.05, 0.88, 0.95, 1],
          ease: "easeInOut",
        }}
        className="relative overflow-hidden rounded-[36px] bg-white"
        style={{
          width: 230,
          height: 460,
          border: "8px solid var(--color-bg-soft)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          boxSizing: "content-box",
        }}
      >
        <div
          className="bg-bg-soft absolute top-0 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-b-lg"
          style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
        />
        <motion.div
          animate={{ y: [0, -400, -400] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.5, 1], ease: "linear" }}
          style={{ padding: "40px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {scrollItems.map((type, i) => (
            <div
              key={i}
              style={{
                height: 56,
                background: "var(--color-background)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                gap: 10,
                alignItems: "center",
                boxSizing: "border-box",
                flexShrink: 0,
              }}
            >
              <div className="bg-border h-8 w-8 shrink-0 rounded-lg" />
              <div style={{ flex: 1 }}>
                <div
                  className="bg-border-strong mb-[6px] h-[10px] rounded"
                  style={{ width: type % 2 === 0 ? "50%" : "70%" }}
                />
                <div className="bg-border h-2 w-[40%] rounded" />
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div
          animate={{ opacity: [0, 0, 1, 1] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            times: [0, 0.45, 0.55, 1],
            ease: "easeInOut",
          }}
          className="bg-white/20 absolute inset-0 z-[5] backdrop-blur-[4px]"
        />
        <motion.div
          animate={{ y: [-120, -120, 32, 32] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.5, 0.6, 1], ease: "easeOut" }}
          className="absolute inset-x-4 z-20 flex items-center gap-3 rounded-2xl border border-magenta/30 bg-white/95 p-4 shadow-[0_14px_28px_rgba(244,114,182,0.15),0_0_30px_rgba(244,114,182,0.2)] backdrop-blur-[12px]"
          style={{ top: 0 }}
        >
          <div className="text-magenta flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-magenta-tint">
            <Pill size={20} />
          </div>
          <div>
            <div
              className="text-ink-900 text-sm font-bold"
              style={{ marginBottom: 3, lineHeight: 1.2 }}
            >
              Take sugar tablets
            </div>
            <div className="text-ink-500 text-xs" style={{ lineHeight: 1.2 }}>
              Take 1 tablet after food
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureFindCare() {
  const pins = [
    { id: 1, top: 40, left: 80, delay: 0, main: false },
    { id: 2, top: 120, left: 240, delay: 0.08, main: false },
    { id: 3, top: 150, left: 140, delay: 0.16, main: true },
  ] as const;

  return (
    <div
      style={{
        position: "relative",
        width: 340,
        height: 400,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
      }}
    >
      <motion.div
        animate={{
          opacity: [0, 1, 1, 0, 0],
          filter: ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)", "blur(12px)"],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          times: [0, 0.05, 0.88, 0.95, 1],
          ease: "easeInOut",
        }}
        className="relative overflow-hidden rounded-[28px] border border-border bg-background outline outline-[6px] outline-white shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
        style={{ width: 300, height: 300 }}
      >
        <motion.div
          animate={{ x: [0, -30], y: [0, -30] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          className="map-grid absolute opacity-50"
          style={{ inset: "-60px" }}
        />
        {pins.map((pin) => (
          <motion.div
            key={pin.id}
            animate={{ y: [-40, 0, 0], opacity: [0, 1, 1], scale: [0, 1, 1] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              times: [0 + pin.delay, 0.15 + pin.delay, 1],
              ease: "easeOut",
            }}
            style={{ position: "absolute", top: pin.top, left: pin.left }}
          >
            {pin.main ? (
              <motion.div
                animate={{
                  scale: [1, 1, 1.25, 1.25],
                  boxShadow: [
                    "0 0 0px rgba(6, 182, 212, 0)",
                    "0 0 0px rgba(6, 182, 212, 0)",
                    "0 16px 32px rgba(6, 182, 212, 0.6)",
                    "0 16px 32px rgba(6, 182, 212, 0.6)",
                  ],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  times: [0, 0.3, 0.45, 1],
                  ease: "easeInOut",
                }}
                className="flex items-center justify-center border-[2.5px] border-white"
                style={{
                  width: 40,
                  height: 40,
                  marginLeft: -20,
                  marginTop: -40,
                  background: "var(--color-secondary)",
                  borderRadius: "50% 50% 50% 4px",
                  transform: "rotate(-45deg)",
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white" }} />
              </motion.div>
            ) : (
              <div
                className="flex items-center justify-center border-2 border-white"
                style={{
                  width: 26,
                  height: 26,
                  marginLeft: -13,
                  marginTop: -26,
                  background: "var(--color-ink-400)",
                  borderRadius: "50% 50% 50% 4px",
                  transform: "rotate(-45deg)",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
              </div>
            )}
          </motion.div>
        ))}
        <motion.div
          animate={{ y: [120, 120, 0, 0], opacity: [0, 0, 1, 1] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            times: [0, 0.35, 0.45, 1],
            ease: "easeOut",
          }}
          className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-secondary/20 bg-white/95 p-[14px] shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur-[12px]"
        >
          <div className="text-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-tint">
            <Hospital size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="text-ink-900 text-sm font-bold" style={{ marginBottom: 2 }}>
              City Hospital
            </div>
            <div className="text-ink-500 flex items-center gap-[6px] text-xs">
              <span className="text-primary font-bold">Open</span> • 2.4 km
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

const FEATURES = [
  {
    key: "records",
    kickerClass: "text-primary",
    kicker: "Organize Medical Records",
    title: "Your entire health history, organized.",
    body: "Upload and store lab reports, scan results, discharge summaries, and prescriptions. Share with any doctor in seconds via a secure link.",
    bullets: [
      "Organize by date, doctor, or condition",
      "Share securely with QR or link",
      "Works offline — no internet needed to view",
    ],
    chip: "bg-primary-tint text-primary",
    mock: <FeatureMedicalRecords />,
    reverse: false,
  },
  {
    key: "reminders",
    kickerClass: "text-magenta",
    kicker: "Smart Medication Reminders",
    title: "Never miss a dose again.",
    body: `Set up your full medication schedule once. ${BRAND.name} adapts to your routine and sends reminders at the exact right moment.`,

    bullets: [
      "Morning, noon, and night alerts",
      "Snooze or reschedule instantly",
      "Tracks missed doses for your doctor",
    ],
    chip: "bg-magenta-tint text-magenta",
    mock: <FeatureSmartReminders />,
    reverse: true,
  },
  {
    key: "find-care",
    kickerClass: "text-secondary",
    kicker: "Find Care Instantly",
    title: "Discover care near you, instantly.",
    body: `Locate the nearest verified hospitals, clinics, and pharmacies. Real-time hours, ratings, and turn-by-turn directions — all inside ${BRAND.name}.`,

    bullets: [
      "Filter by specialty or rating",
      "Open now / 24h emergency tags",
      "Save favorites for quick access",
    ],
    chip: "bg-secondary-tint text-secondary",
    mock: <FeatureFindCare />,
    reverse: false,
  },
] as const;

/* Port of `App.jsx:957–1070` — staggered `whileInView` blocks. */
export default function Features() {
  const [h2Ref, h2In] = useInView<HTMLDivElement>();

  return (
    <section
      id="features"
      className="overflow-hidden bg-white"
      style={{ padding: "100px 6% 60px" }}
    >
      <div
        ref={h2Ref}
        style={{
          textAlign: "center",
          marginBottom: 100,
          opacity: h2In ? 1 : 0,
          transform: h2In ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}
      >
        <h2
          className="font-heading text-ink-900"
          style={{ fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", letterSpacing: "-0.025em" }}
        >
          Smart and Affordable.
        </h2>
        <p
          className="text-ink-500 mt-4 text-[17px]"
          style={{ maxWidth: 520, margin: "16px auto 0", lineHeight: 1.6 }}
        >
          Experience the future of healthcare management with our beautifully designed, intuitive
          platform.
        </p>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 2%" }}>
        {FEATURES.map((f, idx) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-wrap items-center gap-[8%] ${f.reverse ? "flex-row-reverse" : ""}`}
            style={{ marginBottom: idx === FEATURES.length - 1 ? 60 : 140 }}
          >
            <div style={{ flex: 1, minWidth: 320, padding: "20px 0" }}>
              <div
                className={`text-[13px] font-extrabold tracking-[0.12em] uppercase ${f.kickerClass}`}
                style={{ marginBottom: 14 }}
              >
                {f.kicker}
              </div>
              <h3
                className="font-heading text-ink-900"
                style={{
                  fontSize: "clamp(28px,3.5vw,44px)",
                  fontWeight: 800,
                  marginBottom: 20,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                }}
              >
                {f.title}
              </h3>
              <p
                className="text-ink-600 text-[17px]"
                style={{ lineHeight: 1.8, marginBottom: 32, maxWidth: 640 }}
              >
                {f.body}
              </p>
              <ul
                className="grid gap-4"
                style={{
                  listStyle: "none",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                }}
              >
                {f.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="text-ink-700 text-[15.5px] font-semibold"
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, lineHeight: 1.5 }}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${f.chip}`}
                      style={{ marginTop: 2 }}
                    >
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{ flex: "1 1 45%", minWidth: 360, display: "flex", justifyContent: "center" }}
            >
              {f.mock}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
