"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText, FlaskConical, FolderHeart, Hospital, Pill, Share2, ShieldCheck, Stethoscope } from "lucide-react";

import { useInView } from "@/features/landing/use-in-view";
import { BRAND } from "@/shared/brand";

/* Port of `App.jsx:338–538` (F1 medical records, F2 smart reminders, F3 find care) plus
   the three feature blocks (`App.jsx:957–1070`). All inline brand colours migrated to
   tokens (classes); framer-motion shadow/blur keyframes keep their literal composite
   strings (lint-safe: they do not begin with `#` or `rgba(`). */

function FeatureMedicalRecords() {
  // We use a 10s continuous loop.
  // P1: Arrive (0s - 1.2s) -> 0 - 0.12
  // P2: Scan (1.5s - 3s) -> 0.15 - 0.3
  // P3: Organize (3.5s - 5s) -> 0.35 - 0.5
  // P4: Secure (5.5s - 7s) -> 0.55 - 0.7
  // P5: Share (7.5s - 9s) -> 0.75 - 0.9
  // Reset (9.5s - 10s) -> 0.95 - 1.0

  const DURATION = 10;
  
  return (
    <div className="relative mx-auto flex items-center justify-center w-full max-w-[480px] h-[340px]">
      <motion.div
        className="relative flex items-center justify-center w-full h-full rounded-[32px] bg-white border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)] overflow-hidden"
        whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(0,0,0,0.08)" }}
        transition={{ duration: 0.3 }}
      >
        {/* Subtle grid background for the "dashboard" feel */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#172033 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        {/* --- CENTRAL VAULT / ORGANIZER (Appears in P3/P4) --- */}
        <motion.div
          animate={{
            opacity: [0, 0, 1, 1, 0, 0],
            scale: [0.9, 0.9, 1, 1, 0.9, 0.9],
            y: [20, 20, 0, 0, 20, 20]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.45, 0.5, 0.75, 0.8, 1], ease: "easeInOut" }}
          className="absolute z-10 flex flex-col items-center justify-center w-[160px] h-[160px] rounded-3xl bg-[#F0FAF7] border border-[#DDECE7] shadow-sm"
        >
          <div className="relative">
            <ShieldCheck size={48} className="text-[#00A88F]" />
            <motion.div
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#00A88F] rounded-full blur-[24px] -z-10"
            />
          </div>
          <div className="mt-3 text-xs font-bold text-[#172033]">Securely stored</div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#00A88F]">
            <CheckCircle2 size={10} /> Organized
          </div>
        </motion.div>

        {/* --- DOCUMENTS --- */}
        {/* 1. Lab Report */}
        <motion.div
          animate={{
            opacity: [0, 1, 1, 0, 0],
            x: [-100, -60, -80, 0, 0],
            y: [-80, -40, -40, 0, 0],
            scale: [0.8, 1, 0.85, 0.6, 0.6]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.1, 0.35, 0.5, 1], ease: "easeInOut" }}
          className="absolute z-20 flex flex-col w-[120px] bg-white rounded-xl border border-slate-100 shadow-sm p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-500"><FlaskConical size={12} /></div>
            <div className="text-[10px] font-bold text-[#172033]">Lab Report</div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-1" />
          <div className="w-2/3 h-1.5 bg-slate-100 rounded-full" />
        </motion.div>

        {/* 2. Prescription */}
        <motion.div
          animate={{
            opacity: [0, 1, 1, 0, 0],
            x: [100, 70, 80, 0, 0],
            y: [60, 30, 30, 0, 0],
            scale: [0.8, 1, 0.85, 0.6, 0.6]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.12, 0.35, 0.5, 1], ease: "easeInOut" }}
          className="absolute z-20 flex flex-col w-[120px] bg-white rounded-xl border border-slate-100 shadow-sm p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-50 text-purple-500"><Pill size={12} /></div>
            <div className="text-[10px] font-bold text-[#172033]">Prescription</div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-1" />
          <div className="w-3/4 h-1.5 bg-slate-100 rounded-full" />
        </motion.div>

        {/* 3. Scan Report */}
        <motion.div
          animate={{
            opacity: [0, 1, 1, 0, 0],
            x: [-80, -40, -50, 0, 0],
            y: [80, 50, 50, 0, 0],
            scale: [0.8, 1, 0.85, 0.6, 0.6]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.14, 0.35, 0.5, 1], ease: "easeInOut" }}
          className="absolute z-20 flex flex-col w-[120px] bg-white rounded-xl border border-slate-100 shadow-sm p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[#F0FAF7] text-[#00A88F]"><FileText size={12} /></div>
            <div className="text-[10px] font-bold text-[#172033]">Scan Report</div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-1" />
          <div className="w-1/2 h-1.5 bg-slate-100 rounded-full" />
        </motion.div>

        {/* 4. Discharge Summary (This one will be shared in P5) */}
        <motion.div
          animate={{
            opacity: [0, 1, 1, 1, 1, 0],
            x: [90, 40, 50, 0, 80, 80],
            y: [-90, -50, -50, 0, -40, -40],
            scale: [0.8, 1, 0.85, 0, 1, 1]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.16, 0.35, 0.5, 0.75, 0.95], ease: "easeInOut" }}
          className="absolute z-30 flex flex-col w-[120px] bg-white rounded-xl border border-slate-100 shadow-lg p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-50 text-orange-500"><Stethoscope size={12} /></div>
            <div className="text-[10px] font-bold text-[#172033]">Summary</div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-1" />
          <div className="w-4/5 h-1.5 bg-slate-100 rounded-full" />
        </motion.div>

        {/* --- SCANNING LINE (P2) --- */}
        <motion.div
          animate={{
            opacity: [0, 0, 1, 1, 0, 0],
            top: ["0%", "0%", "10%", "90%", "90%", "100%"]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.15, 0.16, 0.3, 0.31, 1], ease: "linear" }}
          className="absolute left-0 right-0 z-40 h-[2px] bg-[#00A88F] shadow-[0_0_12px_#00A88F]"
        />

        {/* --- TEXT LABELS --- */}
        <motion.div
          animate={{ opacity: [0, 0, 1, 0, 0, 0] }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.15, 0.2, 0.3, 0.35, 1], ease: "easeInOut" }}
          className="absolute bottom-6 z-50 px-4 py-1.5 rounded-full bg-[#172033] text-white text-[11px] font-semibold shadow-lg"
        >
          Scanning records...
        </motion.div>
        <motion.div
          animate={{ opacity: [0, 0, 0, 1, 0, 0] }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.3, 0.35, 0.45, 0.5, 1], ease: "easeInOut" }}
          className="absolute bottom-6 z-50 px-4 py-1.5 rounded-full bg-[#172033] text-white text-[11px] font-semibold shadow-lg"
        >
          Organizing...
        </motion.div>

        {/* --- DOCTOR / SHARE ICON (P5) --- */}
        <motion.div
          animate={{
            opacity: [0, 0, 0, 0, 1, 0],
            scale: [0.8, 0.8, 0.8, 0.8, 1, 1],
            x: [0, 0, 0, 0, -80, -80]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.6, 0.7, 0.75, 0.8, 0.95], ease: "easeInOut" }}
          className="absolute z-20 flex flex-col items-center justify-center w-[90px] h-[90px] rounded-2xl bg-white border border-slate-100 shadow-md"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F0FAF7] text-[#00A88F] mb-1">
            <Share2 size={20} />
          </div>
          <div className="text-[10px] font-bold text-[#172033]">Dr. Smith</div>
        </motion.div>

        {/* --- SHARE CONNECT LINE (P5) --- */}
        <motion.div
          animate={{
            opacity: [0, 0, 0, 0, 1, 0],
            width: [0, 0, 0, 0, 60, 60]
          }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.75, 0.8, 0.85, 0.9, 0.95], ease: "easeOut" }}
          className="absolute z-10 h-[2px] border-t-2 border-dashed border-[#00A88F]/40"
          style={{ top: "45%", left: "50%", transform: "translateX(-50%)" }}
        />
        
        <motion.div
          animate={{ opacity: [0, 0, 0, 0, 1, 0] }}
          transition={{ duration: DURATION, repeat: Infinity, times: [0, 0.7, 0.8, 0.85, 0.9, 0.95], ease: "easeInOut" }}
          className="absolute bottom-6 z-50 px-4 py-1.5 rounded-full bg-[#00A88F] text-white text-[11px] font-semibold shadow-lg"
        >
          Secure link ready
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
