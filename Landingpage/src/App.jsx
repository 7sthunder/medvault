import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  FolderHeart,
  Pill,
  Clock,
  Bot,
  Hospital,
  ShieldCheck,
  Globe,
  ChevronRight,
  ArrowRight,
  Database,
  BellRing,
  UploadCloud,
  Heart,
  Play,
  Apple,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Stethoscope,
  X,
} from "lucide-react";
import HeroVisual from "./components/HeroVisual";
import MediTrackAIAuthIllustration from "../MediTrackAIAuthIllustration";

/* ─────────────────────────── helpers ─────────────────────────── */
const useInView = (threshold = 0.12) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

/* ─────────────────────── mascot SVGs ─────────────────────────── */
const DoctorMascot = ({ color = "#10b981", flipped = false, delay = "0s" }) => (
  <div
    style={{
      animation: "float 3s ease-in-out infinite",
      animationDelay: delay,
      transform: flipped ? "scaleX(-1)" : "none",
      display: "inline-block",
    }}
  >
    <svg width="120" height="170" viewBox="0 0 110 160" fill="none">
      <rect x="25" y="80" width="60" height="65" rx="18" fill={color} opacity="0.92" />
      <rect x="30" y="85" width="50" height="60" rx="14" fill="white" opacity="0.15" />
      <ellipse cx="55" cy="55" rx="28" ry="30" fill="#FDDCB5" />
      <ellipse cx="55" cy="30" rx="28" ry="14" fill="#1e293b" />
      <ellipse cx="44" cy="52" rx="4" ry="4.5" fill="white" />
      <ellipse cx="66" cy="52" rx="4" ry="4.5" fill="white" />
      <ellipse cx="44" cy="53" rx="2.2" ry="2.5" fill="#1e293b" />
      <ellipse cx="66" cy="53" rx="2.2" ry="2.5" fill="#1e293b" />
      <path
        d="M44 65 Q55 73 66 65"
        stroke="#c47a3a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 100 Q30 115 38 125 Q48 135 55 128"
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="55" cy="128" r="5" fill={color} stroke="#1e293b" strokeWidth="1.5" />
      <rect x="62" y="95" width="22" height="28" rx="4" fill="white" opacity="0.95" />
      <rect x="65" y="99" width="16" height="2" rx="1" fill={color} />
      <rect x="65" y="104" width="12" height="2" rx="1" fill="#cbd5e1" />
      <rect x="65" y="109" width="14" height="2" rx="1" fill="#cbd5e1" />
      <rect x="33" y="138" width="18" height="18" rx="8" fill={color} opacity="0.85" />
      <rect x="59" y="138" width="18" height="18" rx="8" fill={color} opacity="0.85" />
      <ellipse cx="42" cy="156" rx="12" ry="5" fill="#1e293b" />
      <ellipse cx="68" cy="156" rx="12" ry="5" fill="#1e293b" />
    </svg>
  </div>
);

const RobotMascot = ({ color = "#8b5cf6", delay = "0.5s", cuter = false }) => (
  <div
    style={{
      animation: "float 3.5s ease-in-out infinite",
      animationDelay: delay,
      display: "inline-block",
    }}
  >
    <svg width="120" height="155" viewBox="0 0 100 150" fill="none">
      <rect x="48" y="5" width="4" height="15" rx="2" fill={color} />
      <circle cx="50" cy="5" r="6" fill={color}>
        <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect
        x="15"
        y="20"
        width="70"
        height="55"
        rx="22"
        fill="#1e293b"
        stroke={color}
        strokeWidth="2.5"
      />
      <rect x="20" y="25" width="60" height="45" rx="16" fill="#0f172a" />
      <g>
        <circle cx="36" cy="45" r="9" fill={color} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="64" cy="45" r="9" fill={color} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
        </circle>
        {cuter ? (
          <>
            <path d="M34 42 Q36 40 38 42 Q40 44 36 48 Q32 44 34 42" fill="white" />
            <path d="M62 42 Q64 40 66 42 Q68 44 64 48 Q60 44 62 42" fill="white" />
          </>
        ) : (
          <>
            <circle cx="36" cy="43" r="3" fill="white" />
            <circle cx="64" cy="43" r="3" fill="white" />
          </>
        )}
      </g>
      {cuter && (
        <>
          <circle cx="28" cy="55" r="4" fill="#f472b6" opacity="0.4" />
          <circle cx="72" cy="55" r="4" fill="#f472b6" opacity="0.4" />
        </>
      )}
      <path
        d="M42 58 Q50 64 58 58"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <rect
        x="22"
        y="75"
        width="56"
        height="50"
        rx="18"
        fill="#1e293b"
        stroke={color}
        strokeWidth="2"
      />
      <rect x="30" y="85" width="40" height="25" rx="10" fill="#0f172a" />
      <path d="M46 92 Q50 88 54 92 Q58 96 50 102 Q42 96 46 92" fill={color} opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
      </path>
      <rect
        x="4"
        y="82"
        width="14"
        height="35"
        rx="7"
        fill="#1e293b"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x="82"
        y="82"
        width="14"
        height="35"
        rx="7"
        fill="#1e293b"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x="28"
        y="125"
        width="18"
        height="15"
        rx="7"
        fill="#1e293b"
        stroke={color}
        strokeWidth="2"
      />
      <rect
        x="54"
        y="125"
        width="18"
        height="15"
        rx="7"
        fill="#1e293b"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  </div>
);

const NurseMascot = ({ delay = "1s" }) => (
  <div
    style={{
      animation: "float 4s ease-in-out infinite",
      animationDelay: delay,
      display: "inline-block",
    }}
  >
    <svg width="110" height="160" viewBox="0 0 100 155" fill="none">
      <rect
        x="22"
        y="14"
        width="56"
        height="18"
        rx="6"
        fill="white"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <rect
        x="42"
        y="10"
        width="16"
        height="14"
        rx="4"
        fill="white"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <rect x="47" y="13" width="6" height="8" rx="1" fill="#10b981" />
      <rect x="44" y="16" width="12" height="2" rx="1" fill="#10b981" />
      <ellipse cx="50" cy="46" rx="26" ry="27" fill="#FDDCB5" />
      <ellipse cx="40" cy="44" rx="3.5" ry="4" fill="white" />
      <ellipse cx="60" cy="44" rx="3.5" ry="4" fill="white" />
      <ellipse cx="40" cy="45" rx="2" ry="2.3" fill="#1e293b" />
      <ellipse cx="60" cy="45" rx="2" ry="2.3" fill="#1e293b" />
      <ellipse cx="32" cy="52" rx="6" ry="4" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="68" cy="52" rx="6" ry="4" fill="#fca5a5" opacity="0.5" />
      <path
        d="M40 57 Q50 65 60 57"
        stroke="#c47a3a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <rect
        x="20"
        y="72"
        width="60"
        height="62"
        rx="18"
        fill="white"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <rect x="28" y="80" width="44" height="54" rx="12" fill="#10b981" opacity="0.1" />
      <rect
        x="44"
        y="78"
        width="12"
        height="30"
        rx="3"
        fill="white"
        stroke="#10b981"
        strokeWidth="1"
      />
      <rect x="44" y="88" width="12" height="3" rx="1" fill="#10b981" />
      <rect x="47" y="83" width="3" height="12" rx="1" fill="#10b981" />
      <rect
        x="58"
        y="90"
        width="24"
        height="18"
        rx="5"
        fill="#f0fdf4"
        stroke="#10b981"
        strokeWidth="1"
      />
      <circle cx="64" cy="96" r="3" fill="#10b981" />
      <circle cx="74" cy="96" r="3" fill="#f472b6" />
      <circle cx="64" cy="103" r="3" fill="#06b6d4" />
      <circle cx="74" cy="103" r="3" fill="#a78bfa" />
      <rect x="28" y="128" width="18" height="22" rx="8" fill="#10b981" opacity="0.8" />
      <rect x="54" y="128" width="18" height="22" rx="8" fill="#10b981" opacity="0.8" />
      <ellipse cx="37" cy="150" rx="12" ry="5" fill="#1e293b" />
      <ellipse cx="63" cy="150" rx="12" ry="5" fill="#1e293b" />
    </svg>
  </div>
);

const PrescriptionMascot = ({ delay = "0s" }) => (
  <div
    style={{
      animation: "float 3s ease-in-out infinite",
      animationDelay: delay,
      display: "inline-block",
      width: 200,
      maxWidth: "100%",
      lineHeight: 0,
    }}
  >
    <img
      src="/how-it-works/prescription.png"
      alt="Medical profile illustration with prescription clipboard, DNA helix, cross, and medications"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  </div>
);

const AIRobotReadingMascot = ({ delay = "0.5s" }) => (
  <div
    style={{
      position: "relative",
      display: "inline-block",
      width: 190,
      maxWidth: "100%",
      paddingBottom: 12,
    }}
  >
    <div
      style={{
        animation: "float 3.5s ease-in-out infinite",
        animationDelay: delay,
      }}
    >
      <img
        src="/how-it-works/ai-doctor.png"
        alt="Friendly AI doctor assistant presenting analyzed health data"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        bottom: 4,
        width: "68%",
        height: 16,
        marginLeft: "-34%",
        background: "radial-gradient(ellipse at center, rgba(15,23,42,0.2) 0%, transparent 72%)",
        filter: "blur(5px)",
        pointerEvents: "none",
        animation: "shadowPulse 3.5s ease-in-out infinite",
        animationDelay: delay,
      }}
    />
  </div>
);

const ReminderMascot = ({ delay = "1s" }) => (
  <div
    style={{
      animation: "float 4s ease-in-out infinite",
      animationDelay: delay,
      display: "inline-block",
    }}
  >
    <img
      src="/how-it-works/reminders-mobile.png"
      alt="Smartphone showing smart medication reminders and sugar tablet alerts"
      style={{ width: 200, maxWidth: "100%", height: "auto", display: "block" }}
    />
  </div>
);

const ScrollingServices = () => {
  const services = ["Medical Reports", "Reminders", "AI Insights", "Nearby Services"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % services.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [services.length]);

  return (
    <div
      style={{
        display: "inline-block",
        height: 24,
        overflow: "hidden",
        verticalAlign: "middle",
        marginLeft: 6,
        position: "relative",
        minWidth: 160,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={services[index]}
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -22, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#10b981",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            whiteSpace: "nowrap",
            lineHeight: "24px",
          }}
        >
          {services[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────── dashboard mockup ──────────────────────── */
const StepCard = ({ num, icon, title, desc, color, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        textAlign: "center",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.7s ease",
        transitionDelay: delay,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: `${color}15`,
          border: `2px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          margin: "0 auto 16px",
          position: "relative",
        }}
      >
        {icon}
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: color,
            color: "white",
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {num}
        </div>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 8,
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          lineHeight: 1.65,
          maxWidth: 200,
          margin: "0 auto",
        }}
      >
        {desc}
      </div>
    </div>
  );
};

const TestimonialCard = ({ name, role, text, initial, bg, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        background: "white",
        borderRadius: 20,
        padding: "26px 22px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.7s ease",
        transitionDelay: delay,
      }}
    >
      <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <CheckCircle2 key={s} size={14} color="#f59e0b" fill="#f59e0b30" />
        ))}
      </div>
      <p
        style={{
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.75,
          marginBottom: 16,
          fontStyle: "italic",
        }}
      >
        "{text}"
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>{name}</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>{role}</div>
        </div>
      </div>
    </div>
  );
};

const StatPill = ({ num, label, color }) => (
  <div style={{ textAlign: "center" }}>
    <div
      style={{
        fontSize: 36,
        fontWeight: 900,
        color,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        lineHeight: 1,
      }}
    >
      {num}
    </div>
    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, letterSpacing: "0.04em" }}>
      {label}
    </div>
  </div>
);

const FeatureMedicalRecords = () => (
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
      {/* Card 3 (back) */}
      <motion.div
        animate={{ y: [60, -40, -40] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.15, 1], ease: "easeOut" }}
        style={{
          position: "absolute",
          width: 310,
          height: 200,
          borderRadius: 20,
          background: "rgba(255,255,255,0.4)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.4)",
          top: 100,
        }}
      />
      {/* Card 2 (middle) */}
      <motion.div
        animate={{ y: [60, -10, -10] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.18, 1], ease: "easeOut" }}
        style={{
          position: "absolute",
          width: 340,
          height: 220,
          borderRadius: 24,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.5)",
          top: 110,
        }}
      />
      {/* Card 1 (front active) */}
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
        style={{
          position: "absolute",
          width: 380,
          height: 270,
          borderRadius: 28,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          top: 100,
          padding: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              flexShrink: 0,
            }}
          >
            <FolderHeart size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 16,
                width: 140,
                background: "#e2e8f0",
                borderRadius: 6,
                marginBottom: 10,
              }}
            />
            <div style={{ height: 12, width: 100, background: "#f1f5f9", borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0 16px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <motion.div
            animate={{ width: ["0%", "100%", "100%"] }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0.1, 0.35, 1], ease: "easeOut" }}
            style={{ height: 12, background: "#f8fafc", borderRadius: 6 }}
          />
          <motion.div
            animate={{ width: ["0%", "85%", "85%"] }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0.15, 0.4, 1], ease: "easeOut" }}
            style={{ height: 12, background: "#f8fafc", borderRadius: 6 }}
          />
          <motion.div
            animate={{ width: ["0%", "60%", "60%"] }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0.2, 0.45, 1], ease: "easeOut" }}
            style={{ height: 12, background: "#f8fafc", borderRadius: 6 }}
          />
          <motion.div
            animate={{ width: ["0%", "75%", "75%"] }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0.25, 0.5, 1], ease: "easeOut" }}
            style={{ height: 12, background: "#f8fafc", borderRadius: 6 }}
          />
        </div>
      </motion.div>
    </motion.div>
  </div>
);

const FeatureSmartReminders = () => {
  const scrollItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 10 items for long continuous scroll
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
        style={{
          width: 230,
          height: 460,
          borderRadius: 36,
          background: "white",
          border: "8px solid #f1f5f9",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          overflow: "hidden",
          position: "relative",
          boxSizing: "content-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 80,
            height: 20,
            background: "#f1f5f9",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            zIndex: 10,
          }}
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
                background: "#f8fafc",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                gap: 10,
                alignItems: "center",
                boxSizing: "border-box",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#e2e8f0",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 10,
                    width: type % 2 === 0 ? "50%" : "70%",
                    background: "#cbd5e1",
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                />
                <div style={{ height: 8, width: "40%", background: "#e2e8f0", borderRadius: 4 }} />
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
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
            zIndex: 5,
          }}
        />
        <motion.div
          animate={{ y: [-120, -120, 32, 32] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.5, 0.6, 1], ease: "easeOut" }}
          style={{
            position: "absolute",
            top: 0,
            left: 16,
            right: 16,
            zIndex: 20,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            border: "1px solid rgba(244, 114, 182, 0.3)",
            boxShadow: "0 14px 28px rgba(244, 114, 182, 0.15), 0 0 30px rgba(244, 114, 182, 0.2)",
            padding: "16px 14px",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#fce7f3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f472b6",
              flexShrink: 0,
            }}
          >
            <Pill size={20} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 3,
                lineHeight: 1.2,
              }}
            >
              Take sugar tablets
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.2 }}>
              Take 1 tablet after food
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const FeatureFindCare = () => (
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
      style={{
        width: 300,
        height: 300,
        borderRadius: 28,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
        position: "relative",
        overflow: "hidden",
        outline: "6px solid white",
      }}
    >
      <motion.div
        animate={{ x: [0, -30], y: [0, -30] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: "-60px",
          backgroundImage:
            "linear-gradient(#e2e8f0 1.5px, transparent 1.5px), linear-gradient(90deg, #e2e8f0 1.5px, transparent 1.5px)",
          backgroundSize: "30px 30px",
          opacity: 0.5,
        }}
      />
      {[
        { id: 1, top: 40, left: 80, delay: 0 },
        { id: 2, top: 120, left: 240, delay: 0.08 },
        { id: 3, top: 150, left: 140, delay: 0.16, main: true },
      ].map((pin) => (
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
              style={{
                width: 40,
                height: 40,
                marginLeft: -20,
                marginTop: -40,
                background: "#06b6d4",
                borderRadius: "50% 50% 50% 4px",
                transform: "rotate(-45deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2.5px solid white",
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white" }} />
            </motion.div>
          ) : (
            <div
              style={{
                width: 26,
                height: 26,
                marginLeft: -13,
                marginTop: -26,
                background: "#94a3b8",
                borderRadius: "50% 50% 50% 4px",
                transform: "rotate(-45deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
            </div>
          )}
        </motion.div>
      ))}
      <motion.div
        animate={{ y: [120, 120, 0, 0], opacity: [0, 0, 1, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.35, 0.45, 1], ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: 14,
          border: "1px solid rgba(6, 182, 212, 0.2)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#cffafe",
            color: "#06b6d4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Hospital size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
            City Hospital
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "#10b981", fontWeight: 700 }}>Open</span> • 2.4 km
          </div>
        </div>
      </motion.div>
    </motion.div>
  </div>
);

/* ──────────────────────────── MAIN ────────────────────────────── */
export default function MediTrackAILanding() {
  const [scrolled, setScrolled] = useState(false);
  const [heroIn, setHeroIn] = useState(false);
  const [view, setView] = useState("landing"); // "landing" or "auth"
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash === "#auth") {
        setView("auth");
      } else {
        setView("landing");
      }
    };
    window.addEventListener("popstate", handlePopState);
    if (window.location.hash === "#auth") {
      setView("auth");
    }
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setView("auth");
    window.location.hash = "auth";
    window.scrollTo(0, 0);
  };

  const closeAuth = () => {
    if (window.location.hash === "#auth") {
      window.history.back(); // popstate will handle setView
    } else {
      setView("landing");
    }
  };

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { from: "bot", text: "Hi! I'm MediTrack AI 🤖. How can I help with your health today?" },
  ]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    setTimeout(() => setHeroIn(true), 100);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [h2Ref, h2In] = useInView();
  const [howRef, howIn] = useInView();
  const [featRef, featIn] = useInView();
  const [ctaRef, ctaIn] = useInView();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const testimonials = [
    {
      name: "Arjun Mehta",
      role: "Diabetes Patient, Chennai",
      initial: "A",
      bg: "linear-gradient(135deg,#10b981,#06b6d4)",
      delay: "0s",
      text: "MediTrack AI changed how I manage my health. The AI reminders for my insulin shots are a lifesaver — literally.",
    },
    {
      name: "Priya Sundar",
      role: "Caretaker, Bangalore",
      initial: "P",
      bg: "linear-gradient(135deg,#f472b6,#8b5cf6)",
      delay: "0.12s",
      text: "Managing my mother's 8 daily medications was chaos. Now everything is organized with smart alerts.",
    },
    {
      name: "Dr. Ravi Kumar",
      role: "General Physician, Hyderabad",
      initial: "R",
      bg: "linear-gradient(135deg,#f59e0b,#ef4444)",
      delay: "0.24s",
      text: "I recommend MediTrack AI to all my patients. Health records access makes consultations 10× more efficient.",
    },
  ];

  return (
    <>
      {view === "landing" ? (
        <>
          <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#f8fafc; color:#0f172a; font-family:'Plus Jakarta Sans',sans-serif; overflow-x:hidden; }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#f1f5f9} ::-webkit-scrollbar-thumb{background:#10b98155;border-radius:3px}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes shadowPulse{0%,100%{opacity:1;transform:scaleX(1)}50%{opacity:0.5;transform:scaleX(1.08)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .cta-primary{
          background:linear-gradient(135deg,#10b981,#059669);
          border:none; color:white;
          padding:14px 32px; border-radius:100px;
          font-size:15px; font-weight:700; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;
          box-shadow:0 8px 32px #10b98145;
          transition:all 0.3s;
        }
        .cta-primary:hover{transform:translateY(-2px);box-shadow:0 12px 40px #10b98160;}
        .cta-ghost{
          background:transparent; border:2px solid #e2e8f0;
          color:#475569; padding:14px 28px; border-radius:100px;
          font-size:15px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;
          transition:all 0.3s;
        }
        .cta-ghost:hover{border-color:#10b981;color:#10b981;}
        .nav-login{background:none;border:none;color:#475569;font-weight:600;font-size:14.5px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:color 0.2s;}
        .nav-login:hover{color:#10b981;}
        .dot-grid{
          background-image:radial-gradient(#10b98118 1.5px, transparent 1.5px);
          background-size:28px 28px;
        }
        .nav-link {
          position: relative;
          background: none;
          border: none;
          color: #475569;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans',sans-serif;
          transition: all 0.3s;
          padding: 8px 16px;
          border-radius: 12px;
          z-index: 1;
        }
        .nav-link::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #10b98115, #06b6d415);
          border: 1px solid #10b98130;
          border-radius: 10px;
          opacity: 0;
          transform: scale(0.9);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: -1;
        }
        .nav-link:hover::before {
          opacity: 1;
          transform: scale(1);
        }
        .nav-link:hover {
          color: #10b981;
        }
      `}</style>

          {/* ──────────── NAV ──────────── */}
          <nav
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 200,
              height: 68,
              background: scrolled ? "rgba(255,255,255,0.95)" : "white",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid #e2e8f0",
              boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 4%",
            }}
          >
            {/* Logo */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              onClick={() => scrollToSection("hero")}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#10b981,#06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px #10b98140",
                }}
              >
                <HeartPulse size={20} color="white" />
              </div>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: "-0.02em",
                  color: "#0f172a",
                }}
              >
                MediTrack<span style={{ color: "#10b981" }}>AI</span>
              </span>
            </div>

            {/* Center links */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {[
                { label: "Home", id: "hero" },
                { label: "How It Works", id: "how-it-works" },
                { label: "Features", id: "features" },
                { label: "Contact", id: "contact" },
              ].map((l) => (
                <button
                  key={l.label}
                  className="nav-link"
                  onClick={() => scrollToSection(l.id)}
                  style={{
                    display: window.innerWidth < 768 ? "none" : "block",
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Right */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="nav-login" onClick={() => openAuth("login")}>
                Log In
              </button>
              <button
                className="cta-primary"
                style={{ padding: "10px 22px", fontSize: 13.5 }}
                onClick={() => openAuth("signup")}
              >
                Create Vault
              </button>
            </div>
          </nav>

          {/* ──────────── HERO ──────────── */}
          <section
            id="hero"
            style={{
              minHeight: "100vh",
              paddingTop: 68,
              display: "flex",
              alignItems: "center",
              position: "relative",
              overflow: "visible",
              background: "linear-gradient(150deg, #f0fdf4 0%, #f8fafc 50%, #f0f9ff 100%)",
            }}
          >
            <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />

            {/* Decorative blobs */}
            <div
              style={{
                position: "absolute",
                top: "5%",
                right: "-8%",
                width: 520,
                height: 520,
                borderRadius: "50%",
                background: "radial-gradient(circle,#10b98118,transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "5%",
                left: "-5%",
                width: 380,
                height: 380,
                borderRadius: "50%",
                background: "radial-gradient(circle,#06b6d418,transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6%",
                padding: "40px 6% 80px",
                width: "100%",
                flexWrap: "wrap",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Left — scaled to visually match the larger phone */}
              <div style={{ flex: "1 1 480px", minWidth: 320 }}>
                <h1
                  style={{
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(42px,5.5vw,72px)",
                    lineHeight: 1.08,
                    letterSpacing: "-0.03em",
                    marginBottom: 26,
                    color: "#0f172a",
                    opacity: heroIn ? 1 : 0,
                    transform: heroIn ? "translateY(0)" : "translateY(24px)",
                    transition: "all 0.7s ease 0.1s",
                  }}
                >
                  Your entire
                  <br />
                  medical life.
                  <br />
                  <span style={{ color: "#10b981" }}>One secure vault.</span>
                </h1>

                <p
                  style={{
                    fontSize: "clamp(14px,1.8vw,17px)",
                    color: "#64748b",
                    lineHeight: 1.8,
                    marginBottom: 28,
                    maxWidth: 480,
                    opacity: heroIn ? 1 : 0,
                    transform: heroIn ? "translateY(0)" : "translateY(16px)",
                    transition: "all 0.7s ease 0.2s",
                  }}
                >
                  MediTrack AI brings your medical records, medicine schedules, appointments, and
                  AI-powered health guidance into one beautifully simple, secure platform.
                </p>

                <div
                  style={{
                    marginBottom: 36,
                    opacity: heroIn ? 1 : 0,
                    transform: heroIn ? "translateY(0)" : "translateY(16px)",
                    transition: "all 0.7s ease 0.25s",
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      color: "#64748b",
                      fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    All in one vault, for your
                  </div>
                  <ScrollingServices />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                    opacity: heroIn ? 1 : 0,
                    transform: heroIn ? "translateY(0)" : "translateY(16px)",
                    transition: "all 0.7s ease 0.3s",
                  }}
                >
                  <button
                    className="cta-primary"
                    style={{
                      padding: "17px 42px",
                      fontSize: 17,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onClick={() => openAuth("signup")}
                  >
                    <HeartPulse size={22} /> Create Your Health Vault
                  </button>
                  <button className="cta-ghost" style={{ padding: "17px 32px", fontSize: 16 }}>
                    ▶ Watch Demo
                  </button>
                </div>

                {/* Social proof avatars */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginTop: 36,
                    opacity: heroIn ? 1 : 0,
                    transition: "all 0.7s ease 0.45s",
                  }}
                >
                  <div style={{ display: "flex" }}>
                    {["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ef4444"].map((c, i) => (
                      <div
                        key={i}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg,${c},${c}99)`,
                          border: "2px solid white",
                          marginLeft: i === 0 ? 0 : -10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {"APRSM"[i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <CheckCircle2 key={s} size={12} color="#f59e0b" fill="#f59e0b30" />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Trusted by millions · Free forever
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  flex: "1 1 520px",
                  minWidth: 320,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <HeroVisual isVisible={heroIn} />
              </div>
            </div>
          </section>

          {/* ──────────── HOW IT WORKS ──────────── */}
          <section
            id="how-it-works"
            style={{ padding: "100px 4% 140px", background: "#f8fafc", overflow: "hidden" }}
          >
            <div
              ref={howRef}
              style={{
                textAlign: "center",
                marginBottom: 90,
                opacity: howIn ? 1 : 0,
                transform: howIn ? "translateY(0)" : "translateY(30px)",
                transition: "all 0.8s ease",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(26px,4vw,48px)",
                  letterSpacing: "-0.025em",
                  color: "#0f172a",
                }}
              >
                Three Simple Steps.
              </h2>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 16,
                  marginTop: 12,
                  maxWidth: 440,
                  margin: "12px auto 0",
                }}
              >
                From upload to insight in minutes — no technical knowledge needed.
              </p>
            </div>

            <div style={{ width: "100%", maxWidth: "none", margin: "0 auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 24,
                  width: "100%",
                  alignItems: "stretch",
                }}
              >
                {[
                  {
                    num: 1,
                    mascot: <PrescriptionMascot />,
                    title: "Create Your Medical Profile",
                    desc: "Start your journey by building a comprehensive health identity. Securely input your medical history, chronic conditions, allergy profiles, and blood group. Our encrypted vault ensures your sensitive data is accessible only by you, providing a solid foundation for personalized AI-driven health management.",
                    color: "#14b8a6",
                  },
                  {
                    num: 2,
                    mascot: <AIRobotReadingMascot />,
                    title: "AI Analyzes Your Data",
                    desc: "Leverage state-of-the-art AI to transform raw medical documents into actionable insights. Upload lab reports, MRI scans, and prescriptions for instant OCR processing. Our engine identifies longitudinal trends, potential drug interactions, and delivers easy-to-understand summaries of complex terminology.",
                    color: "#06b6d4",
                  },
                  {
                    num: 3,
                    mascot: <ReminderMascot />,
                    title: "Get Smart Reminders",
                    desc: "Synchronize your entire treatment plan with an intelligent alerting system that adapts to your routine. Receive precision-timed notifications for medications, follow-up appointments, and preventative screenings. Integrated caregiver alerts ensure you and your loved ones stay perfectly aligned.",
                    color: "#8b5cf6",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 20,
                      background: "white",
                      padding: "32px 22px 36px",
                      borderRadius: 32,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 48px rgba(0,0,0,0.04)",
                      textAlign: "center",
                      opacity: howIn ? 1 : 0,
                      transform: howIn ? "translateY(0)" : "translateY(40px)",
                      transition: `all 0.8s ease ${i * 0.2}s`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 200,
                        width: "100%",
                      }}
                    >
                      <div style={{ transform: "scale(1.15)" }}>{step.mascot}</div>
                    </div>
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: step.color,
                          color: "white",
                          fontWeight: 800,
                          fontSize: 16,
                          marginBottom: 16,
                          boxShadow: `0 4px 12px ${step.color}40`,
                        }}
                      >
                        {step.num}
                      </div>
                      <h3
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          marginBottom: 12,
                          color: "#0f172a",
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          lineHeight: 1.25,
                        }}
                      >
                        {step.title}
                      </h3>
                      <p style={{ color: "#64748b", fontSize: 14.5, lineHeight: 1.75 }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ──────────── FEATURES (Modern SaaS UI) — nav #features ──────────── */}
          <section
            id="features"
            style={{ padding: "100px 6% 60px", background: "white", overflow: "hidden" }}
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
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(32px,4vw,52px)",
                  letterSpacing: "-0.025em",
                  color: "#0f172a",
                }}
              >
                Smart and Affordable.
              </h2>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 17,
                  marginTop: 16,
                  maxWidth: 520,
                  margin: "16px auto 0",
                  lineHeight: 1.6,
                }}
              >
                Experience the future of healthcare management with our beautifully designed,
                intuitive platform.
              </p>
            </div>

            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 2%" }}>
              {/* Feature 1: Left Text, Right Anim */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8%",
                  flexWrap: "wrap",
                  marginBottom: 140,
                }}
              >
                <div style={{ flex: 1, minWidth: 320, padding: "20px 0" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#10b981",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: 14,
                    }}
                  >
                    Organize Medical Records
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      fontSize: "clamp(28px,3.5vw,44px)",
                      fontWeight: 800,
                      marginBottom: 20,
                      color: "#0f172a",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                    }}
                  >
                    Your entire health history, organized.
                  </h3>
                  <p
                    style={{
                      color: "#475569",
                      fontSize: 17,
                      lineHeight: 1.8,
                      marginBottom: 32,
                      maxWidth: 640,
                    }}
                  >
                    Upload and store lab reports, scan results, discharge summaries, and
                    prescriptions. Share with any doctor in seconds via a secure link.
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {[
                      "Organize by date, doctor, or condition",
                      "Share securely with QR or link",
                      "Works offline — no internet needed to view",
                    ].map((b, j) => (
                      <li
                        key={j}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          fontSize: 15.5,
                          color: "#334155",
                          fontWeight: 600,
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#d1fae5",
                            color: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  style={{
                    flex: "1 1 45%",
                    minWidth: 360,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <FeatureMedicalRecords />
                </div>
              </motion.div>

              {/* Feature 2: Right Text, Left Anim */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8%",
                  flexDirection: "row-reverse",
                  flexWrap: "wrap",
                  marginBottom: 140,
                }}
              >
                <div style={{ flex: 1, minWidth: 320, padding: "20px 0" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#f472b6",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: 14,
                    }}
                  >
                    Smart Medication Reminders
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      fontSize: "clamp(28px,3.5vw,44px)",
                      fontWeight: 800,
                      marginBottom: 20,
                      color: "#0f172a",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                    }}
                  >
                    Never miss a dose again.
                  </h3>
                  <p
                    style={{
                      color: "#475569",
                      fontSize: 17,
                      lineHeight: 1.8,
                      marginBottom: 32,
                      maxWidth: 640,
                    }}
                  >
                    Set up your full medication schedule once. MediTrack AI adapts to your routine
                    and sends reminders at the exact right moment.
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {[
                      "Morning, noon, and night alerts",
                      "Snooze or reschedule instantly",
                      "Tracks missed doses for your doctor",
                    ].map((b, j) => (
                      <li
                        key={j}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          fontSize: 15.5,
                          color: "#334155",
                          fontWeight: 600,
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#fce7f3",
                            color: "#f472b6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  style={{
                    flex: "1 1 45%",
                    minWidth: 360,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <FeatureSmartReminders />
                </div>
              </motion.div>

              {/* Feature 3: Left Text, Right Anim */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8%",
                  flexWrap: "wrap",
                  marginBottom: 60,
                }}
              >
                <div style={{ flex: 1, minWidth: 320, padding: "20px 0" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#06b6d4",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: 14,
                    }}
                  >
                    Find Care Instantly
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      fontSize: "clamp(28px,3.5vw,44px)",
                      fontWeight: 800,
                      marginBottom: 20,
                      color: "#0f172a",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                    }}
                  >
                    Discover care near you, instantly.
                  </h3>
                  <p
                    style={{
                      color: "#475569",
                      fontSize: 17,
                      lineHeight: 1.8,
                      marginBottom: 32,
                      maxWidth: 640,
                    }}
                  >
                    Locate the nearest verified hospitals, clinics, and pharmacies. Real-time hours,
                    ratings, and turn-by-turn directions — all inside MediTrack AI.
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {[
                      "Filter by specialty or rating",
                      "Open now / 24h emergency tags",
                      "Save favorites for quick access",
                    ].map((b, j) => (
                      <li
                        key={j}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          fontSize: 15.5,
                          color: "#334155",
                          fontWeight: 600,
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#cffafe",
                            color: "#06b6d4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  style={{
                    flex: "1 1 45%",
                    minWidth: 360,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <FeatureFindCare />
                </div>
              </motion.div>
            </div>
          </section>

          {/* ──────────── TRUST SECTION ──────────── */}
          <section style={{ padding: "80px 4%", background: "white" }}>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 900,
                fontSize: "clamp(24px,3.5vw,44px)",
                textAlign: "center",
                marginBottom: 52,
                letterSpacing: "-0.025em",
                color: "#0f172a",
              }}
            >
              Trusted by real patients.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                gap: 20,
                maxWidth: 1400,
                margin: "0 auto",
              }}
            >
              {testimonials.map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))}
            </div>
          </section>

          {/* ──────────── FINAL CTA ──────────── */}
          <section
            ref={ctaRef}
            style={{
              margin: "0 5% 80px",
              borderRadius: 28,
              padding: "80px 6%",
              textAlign: "center",
              background: "linear-gradient(135deg,#10b981,#059669)",
              position: "relative",
              overflow: "hidden",
              opacity: ctaIn ? 1 : 0,
              transform: ctaIn ? "translateY(0)" : "translateY(40px)",
              transition: "all 0.9s ease",
            }}
          >
            {/* Pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1.5px, transparent 1.5px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -40,
                opacity: 0.15,
                pointerEvents: "none",
              }}
            >
              <DoctorMascot color="white" delay="0s" />
            </div>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 100,
                  padding: "5px 16px",
                  fontSize: 11.5,
                  color: "white",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  marginBottom: 20,
                }}
              >
                Health Services & Tips for Healthy Living
              </div>
              <h2
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(28px,4.5vw,56px)",
                  color: "white",
                  letterSpacing: "-0.03em",
                  marginBottom: 16,
                  lineHeight: 1.1,
                }}
              >
                Start managing your
                <br />
                health today.
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 16.5,
                  marginBottom: 36,
                  maxWidth: 440,
                  margin: "0 auto 36px",
                }}
              >
                Join over 2.4 million patients who manage their health with confidence. Free forever
                for patients.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                <button
                  style={{
                    background: "white",
                    border: "none",
                    color: "#059669",
                    padding: "16px 36px",
                    borderRadius: 100,
                    fontSize: 15.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "center",
                    }}
                  >
                    <HeartPulse size={20} /> Create Your Health Vault
                  </span>
                </button>
                <button
                  style={{
                    background: "transparent",
                    border: "2px solid rgba(255,255,255,0.6)",
                    color: "white",
                    padding: "16px 30px",
                    borderRadius: 100,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "white")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)")
                  }
                >
                  Stay Connected
                </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5, marginTop: 20 }}>
                No credit card required · Cancel anytime · Your data stays yours
              </p>
            </div>
          </section>

          {/* ──────────── FOOTER ──────────── */}
          <footer id="contact" style={{ background: "#0f172a", padding: "56px 6% 32px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr",
                gap: 40,
                marginBottom: 48,
                flexWrap: "wrap",
              }}
            >
              {/* Brand */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "linear-gradient(135deg,#10b981,#06b6d4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HeartPulse size={18} color="white" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      fontWeight: 900,
                      fontSize: 19,
                      color: "white",
                    }}
                  >
                    MediTrack<span style={{ color: "#10b981" }}>AI</span>
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: 13.5, lineHeight: 1.7, maxWidth: 240 }}>
                  A leader in patient care and medical records management. Your health, secured.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  {[
                    <Twitter size={18} />,
                    <Linkedin size={18} />,
                    <Instagram size={18} />,
                    <Youtube size={18} />,
                  ].map((icon, i) => (
                    <div
                      key={i}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "white",
                      }}
                    >
                      {icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Link */}
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
                  Quick Link
                </div>
                {["Home", "About Us", "Pricing", "Doctors", "Contact"].map((l) => (
                  <div
                    key={l}
                    style={{ color: "#64748b", fontSize: 13, marginBottom: 10, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#10b981")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                  >
                    {l}
                  </div>
                ))}
              </div>

              {/* Company */}
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
                  Company
                </div>
                {["Our Company", "Affiliates", "Doctors", "Partnerships"].map((l) => (
                  <div
                    key={l}
                    style={{ color: "#64748b", fontSize: 13, marginBottom: 10, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#10b981")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                  >
                    {l}
                  </div>
                ))}
              </div>

              {/* Support */}
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
                  Support
                </div>
                {["Help Center", "Privacy Policy", "Terms of Service", "Cookie Settings"].map(
                  (l) => (
                    <div
                      key={l}
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginBottom: 10,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#10b981")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                    >
                      {l}
                    </div>
                  ),
                )}
              </div>

              {/* Contact */}
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
                  Contact Us
                </div>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>
                  <div>📍 12, Health Square, Chennai 600001</div>
                  <div style={{ marginTop: 8 }}>📞 +91 98400 00000</div>
                  <div style={{ marginTop: 8 }}>✉️ hello@meditrackai.in</div>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ color: "#334155", fontSize: 12.5 }}>
                © 2026 MediTrack AI · All Rights Reserved.
              </div>
              <div style={{ color: "#334155", fontSize: 12.5 }}>Designed by MediTrack AI Team</div>
            </div>
          </footer>

          {/* ──────────── FLOATING AI CHAT ──────────── */}
          <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999 }}>
            {chatOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: 72,
                  right: 0,
                  width: 300,
                  background: "white",
                  borderRadius: 20,
                  boxShadow: "0 16px 60px rgba(0,0,0,0.15)",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  animation: "slideIn 0.3s ease",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Bot size={24} color="white" />
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                      MediTrack AI
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                      ● Online · Replies instantly
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      color: "white",
                      fontSize: 18,
                      cursor: "pointer",
                      opacity: 0.8,
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Chat body */}
                <div
                  style={{
                    padding: 14,
                    height: 180,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {chatHistory.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: m.from === "bot" ? "flex-start" : "flex-end",
                        background: m.from === "bot" ? "#f0fdf4" : "#10b981",
                        color: m.from === "bot" ? "#0f172a" : "white",
                        padding: "8px 14px",
                        borderRadius: 14,
                        fontSize: 13,
                        lineHeight: 1.55,
                        maxWidth: "85%",
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <input
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatMsg.trim()) {
                        setChatHistory((h) => [
                          ...h,
                          { from: "user", text: chatMsg },
                          {
                            from: "bot",
                            text: "Great question! I'm connecting you with your health data...",
                          },
                        ]);
                        setChatMsg("");
                      }
                    }}
                    placeholder="Ask me anything..."
                    style={{
                      flex: 1,
                      border: "1px solid #e2e8f0",
                      borderRadius: 100,
                      padding: "8px 14px",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (chatMsg.trim()) {
                        setChatHistory((h) => [
                          ...h,
                          { from: "user", text: chatMsg },
                          {
                            from: "bot",
                            text: "Great question! I'm connecting you with your health data... 🫀",
                          },
                        ]);
                        setChatMsg("");
                      }
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "none",
                      color: "white",
                      fontSize: 16,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            {/* FAB */}
            <button
              onClick={() => setChatOpen((o) => !o)}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#10b981,#059669)",
                border: "none",
                color: "white",
                fontSize: 24,
                cursor: "pointer",
                boxShadow: "0 8px 28px #10b98160",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s",
                animation: "pulse 3s infinite",
              }}
            >
              <Bot size={28} />
            </button>
          </div>
        </>
      ) : (
        <MediTrackAIAuthIllustration initialMode={authMode} onClose={closeAuth} />
      )}
    </>
  );
}
