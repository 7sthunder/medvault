"use client";

import {
  AIRobotReadingMascot,
  PrescriptionMascot,
  ReminderMascot,
} from "@/features/landing/mascots";
import { useInView } from "@/features/landing/use-in-view";

const STEPS = [
  {
    num: 1,
    mascot: <PrescriptionMascot />,
    title: "Create Your Medical Profile",
    desc: "Start your journey by building a comprehensive health identity. Securely input your medical history, chronic conditions, allergy profiles, and blood group. Our encrypted vault ensures your sensitive data is accessible only by you, providing a solid foundation for personalized AI-driven health management.",
    colorVar: "var(--color-teal)",
  },
  {
    num: 2,
    mascot: <AIRobotReadingMascot />,
    title: "AI Analyzes Your Data",
    desc: "Leverage state-of-the-art AI to transform raw medical documents into actionable insights. Upload lab reports, MRI scans, and prescriptions for instant OCR processing. Our engine identifies longitudinal trends, potential drug interactions, and delivers easy-to-understand summaries of complex terminology.",
    colorVar: "var(--color-secondary)",
  },
  {
    num: 3,
    mascot: <ReminderMascot />,
    title: "Get Smart Reminders",
    desc: "Synchronize your entire treatment plan with an intelligent alerting system that adapts to your routine. Receive precision-timed notifications for medications, follow-up appointments, and preventative screenings. Integrated caregiver alerts ensure you and your loved ones stay perfectly aligned.",
    colorVar: "var(--color-violet)",
  },
] as const;

/* Port of `App.jsx:878–955` — three-stack grid, `useInView` reveal (never collapses,
   matching Stitch `repeat(3,1fr)`). Step chips tint `${colorVar}` mechanical shadow. */
export default function HowItWorks() {
  const [howRef, howIn] = useInView<HTMLDivElement>();

  return (
    <section
      id="how-it-works"
      className="bg-background overflow-hidden"
      style={{ padding: "100px 4% 140px" }}
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
          className="font-heading text-ink-900"
          style={{ fontWeight: 900, fontSize: "clamp(26px,4vw,48px)", letterSpacing: "-0.025em" }}
        >
          Three Simple Steps.
        </h2>
        <p className="text-ink-500 mt-3 text-base" style={{ maxWidth: 440, margin: "12px auto 0" }}>
          From upload to insight in minutes — no technical knowledge needed.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: "stretch", width: "100%" }}>
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="bg-card border-border shadow-card flex flex-col items-center rounded-[32px] border text-center"
            style={{
              gap: 20,
              padding: "32px 22px 36px",
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
            <div className="w-full">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: step.colorVar,
                  color: "white",
                  fontWeight: 800,
                  fontSize: 16,
                  marginBottom: 16,
                  boxShadow: `0 4px 12px color-mix(in srgb, ${step.colorVar} 25%, transparent)`,
                }}
              >
                {step.num}
              </div>
              <h3
                className="font-heading text-ink-900 text-xl font-extrabold"
                style={{ marginBottom: 12, lineHeight: 1.25 }}
              >
                {step.title}
              </h3>
              <p className="text-ink-500" style={{ fontSize: 14.5, lineHeight: 1.75 }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
