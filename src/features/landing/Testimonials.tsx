"use client";

import { Star } from "lucide-react";

import { useInView } from "@/features/landing/use-in-view";

type Testimonial = {
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  avatarSecondary: string;
  quote: string;
};

/* Port of the `testimonialCard` component (`App.jsx:303–329`) driven by the array ported
   from `App.jsx:1072–1083` (Person A…Person G). Slight tint rows per source. */
const testimonials: Testimonial[] = [
  {
    name: "Person A",
    role: "Family member · Official User",
    initials: "PA",
    avatarColor: "var(--color-primary)",
    avatarSecondary: "var(--color-teal)",
    quote:
      "The hospital had trouble moving my mom's entire medical profile because of incomplete records. But MedVault made it extremely easy to organize and share it all in just one click. Since then, all her appointments across hospitals just connect flawlessly.",
  },
  {
    name: "Person B",
    role: "Official User",
    initials: "PB",
    avatarColor: "var(--color-violet)",
    avatarSecondary: "var(--color-magenta)",
    quote:
      "I've seen a lot of health apps, but MedVault's scan-to-vault system genuinely impressed me—it's fast, precise and easy on my eyes, even for my aging relatives.",
  },
  {
    name: "Person C",
    role: "Official User",
    initials: "PC",
    avatarColor: "var(--color-amber)",
    avatarSecondary: "var(--color-secondary)",
    quote:
      "As a full-time ICU nurse, my med schedule is chaotic. MedVault's smart reminders sync perfectly with my shifts—it's like having a nurse who remembers everything for me.",
  },
  {
    name: "Person D",
    role: "Official User",
    initials: "PD",
    avatarColor: "var(--color-red)",
    avatarSecondary: "var(--color-primary)",
    quote:
      "I finally got my blood reports, prescriptions, and past scans in one place. The AI summary explained my risk factors plainly enough for me to ask my doctor better questions.",
  },
  {
    name: "Person E",
    role: "Official User",
    initials: "PE",
    avatarColor: "var(--color-secondary)",
    avatarSecondary: "var(--color-teal)",
    quote:
      "Searching for 'blood tests near me' again and again is over. MedVault shows nearby labs with doorstep collection; booking took me under a minute.",
  },
  {
    name: "Person F",
    role: "Official User",
    initials: "PF",
    avatarColor: "var(--color-teal)",
    avatarSecondary: "var(--color-primary)",
    quote:
      "The AI insights spotted a slow upward trend in my HbA1c before my next check-up. It recommended a diet tweak that my doctor later confirmed worked perfectly.",
  },
  {
    name: "Person G",
    role: "Official User",
    initials: "PG",
    avatarColor: "var(--color-magenta)",
    avatarSecondary: "var(--color-violet)",
    quote:
      "I'm the first to trust an app with health data, but MedVault's privacy-first design and end-to-end encryption won me over. My files live with me, and only with me.",
  },
];

export default function Testimonials() {
  const [gridRef, gridIn] = useInView<HTMLDivElement>();

  return (
    <section id="testimonials" className="overflow-hidden bg-background" style={{ padding: "100px 6% 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 70 }}>
        <h2 className="font-heading text-ink-900" style={{ fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", letterSpacing: "-0.025em" }}>
          Loved by millions.
        </h2>
        <p className="text-ink-500 mt-4 text-[17px]" style={{ maxWidth: 520, margin: "16px auto 0", lineHeight: 1.6 }}>
          Trusted by people like you — from patients and caregivers to doctors.
        </p>
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 2%",
          alignItems: "stretch",
          opacity: gridIn ? 1 : 0,
          transform: gridIn ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}
      >
        {testimonials.map((t, i) => (
          <div key={t.name} style={{ transitionDelay: `${i * 0.1}s` }}>
            <article
              className="bg-card border-border shadow-card-sm flex h-full flex-col justify-between rounded-3xl border p-7"
              style={{ transition: `all 0.5s ease ${i * 0.1}s` }}
            >
              <div>
                <div className="mb-4 flex gap-[2px]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} className="fill-amber text-amber" aria-hidden />
                  ))}
                </div>
                <p className="text-ink-600 text-[15px] leading-relaxed" style={{ marginBottom: 24 }}>
                  “{t.quote}”
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  aria-hidden
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${t.avatarColor}, color-mix(in srgb, ${t.avatarSecondary} 60%, transparent))`,
                    border: "2px solid white",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-ink-900 font-bold" style={{ fontSize: 15 }}>
                    {t.name}
                  </div>
                  <div className="text-ink-500 text-xs" style={{ marginTop: 2 }}>
                    {t.role}
                  </div>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}