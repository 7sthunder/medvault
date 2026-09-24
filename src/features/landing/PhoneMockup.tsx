"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

/* Port of `Landingpage/src/mobile.jsx` — phone mockup (CSS → globals.css `.mvp-*`).
   Icon/stroke colours resolve through tokens (SVG fills/strokes via Tailwind classes);
   the soft auras stay as gradient strings (visual-identical, lint-allowed composites). */

function useIsNarrow(bp = 768) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [bp]);
  return narrow;
}

function useParallax(sceneRef: React.RefObject<HTMLDivElement | null>) {
  const rawX = useSpring(0, { stiffness: 55, damping: 18 });
  const rawY = useSpring(0, { stiffness: 55, damping: 18 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = sceneRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      rawX.set((e.clientX - (r.left + r.width / 2)) / r.width);
      rawY.set((e.clientY - (r.top + r.height / 2)) / r.height);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [rawX, rawY, sceneRef]);

  return { rawX, rawY };
}

function PhoneScreen() {
  return (
    <div className="mvp-screen">
      <div className="mvp-notch" />
      <div className="mvp-sc-body">
        <div className="mvp-sc-label">
          Recent Reports <span>›</span>
        </div>
        <div className="mvp-sc-row">
          <div className="mvp-sc-ico bg-primary-tint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" className="stroke-primary">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <div className="mvp-sc-t">Blood Test</div>
            <div className="mvp-sc-s">Today</div>
          </div>
          <div className="mvp-sc-d">Today</div>
        </div>
        <div className="mvp-div" />
        <div className="mvp-sc-label">
          Upcoming Appointments <span>›</span>
        </div>
        <div className="mvp-sc-row">
          <div className="mvp-sc-ico bg-blue-tint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" className="stroke-blue">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div className="mvp-sc-t">Dr. Sharma</div>
            <div className="mvp-sc-s">Tomorrow</div>
          </div>
          <div className="mvp-sc-d">8:00 PM</div>
        </div>
      </div>
      <div className="mvp-bottom-nav">
        <div style={{ textAlign: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" className="fill-primary">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <div className="mvp-nav-dot" />
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" opacity="0.6" className="stroke-phone-muted">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" opacity="0.6" className="stroke-phone-muted">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" opacity="0.6" className="stroke-phone-muted">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="mvp-home-bar" />
    </div>
  );
}

const DOTS = [
  { w: 5, h: 5, top: "10%", left: "18%", d: "2.4s", dl: "0s" },
  { w: 4, h: 4, top: "20%", left: "8%", d: "3.1s", dl: "0.6s" },
  { w: 6, h: 6, top: "15%", right: "10%", d: "2.7s", dl: "1.1s" },
  { w: 4, h: 4, top: "35%", left: "5%", d: "3.5s", dl: "0.3s" },
  { w: 5, h: 5, top: "70%", left: "10%", d: "2.9s", dl: "1.7s" },
  { w: 4, h: 4, top: "78%", right: "8%", d: "3.3s", dl: "0.9s" },
  { w: 3, h: 3, top: "85%", left: "30%", d: "2.5s", dl: "1.4s" },
  { w: 5, h: 5, top: "88%", right: "22%", d: "3.7s", dl: "0.2s" },
  { w: 3, h: 3, top: "55%", right: "5%", d: "2.6s", dl: "2s" },
];

const STARS = [
  { top: "8%", left: "30%", d: "3.2s", dl: "0.5s" },
  { top: "22%", right: "15%", d: "2.8s", dl: "1.3s" },
  { top: "60%", left: "7%", d: "3.6s", dl: "0.7s" },
  { top: "75%", right: "12%", d: "2.9s", dl: "1.9s" },
  { top: "90%", left: "55%", d: "3.4s", dl: "0.4s" },
];

export default function PhoneMockup({ isVisible = true }: { isVisible?: boolean }) {
  const isMobile = useIsNarrow(768);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const { rawX, rawY } = useParallax(sceneRef);

  const phoneX = useTransform(rawX, (v) => v * 10);
  const phoneY = useTransform(rawY, (v) => v * 8);
  const phoneRotY = useTransform(rawX, (v) => -18 + v * 6);
  const phoneRotX = useTransform(rawY, (v) => 4 + v * 4);

  return (
    <div
      ref={sceneRef}
      className="font-sans"
      style={{
        width: "100%",
        minHeight: isMobile ? 580 : 820,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "visible",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "140%",
            height: "130%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 50%, transparent 72%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "48%",
            left: "52%",
            transform: "translate(-50%,-50%)",
            width: "80%",
            height: "70%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(52,211,153,0.22) 0%, rgba(52,211,153,0.08) 55%, transparent 80%)",
            filter: "blur(48px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "5%",
            width: "55%",
            height: "55%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(134,239,172,0.14) 0%, transparent 70%)",
            filter: "blur(56px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            left: "8%",
            width: "45%",
            height: "45%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>
      {DOTS.map((s, i) => (
        <div
          key={`d${i}`}
          className="mvp-sp"
          style={{
            width: s.w,
            height: s.h,
            top: s.top,
            left: s.left,
            right: s.right,
            "--d": s.d,
            "--dl": s.dl,
          } as React.CSSProperties}
        />
      ))}
      {STARS.map((s, i) => (
        <div
          key={`s${i}`}
          className="mvp-star"
          style={{ top: s.top, left: s.left, right: s.right, "--d": s.d, "--dl": s.dl } as React.CSSProperties}
        />
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.7 }}
        style={{ position: "relative", width: 756, height: 729 }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            x: phoneX,
            y: phoneY,
            rotateY: phoneRotY,
            rotateX: phoneRotX,
            perspective: 900,
          }}
        >
          <div className="mvp-phone-wrap">
            <div className="mvp-phone-outer">
              <div className="mvp-phone-inner">
                <div className="mvp-btn-r" />
                <div className="mvp-btn-l1" />
                <div className="mvp-btn-l2" />
                <PhoneScreen />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}