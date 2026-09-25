import { useState, useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

function useIsNarrow(bp = 768) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const u = () => setNarrow(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, [bp]);
  return narrow;
}

function useParallax(sceneRef) {
  const rawX = useSpring(0, { stiffness: 55, damping: 18 });
  const rawY = useSpring(0, { stiffness: 55, damping: 18 });

  useEffect(() => {
    const onMove = (e) => {
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes mvp-sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
  @keyframes mvp-phoneFloat {
    0%  { transform: perspective(900px) rotateY(-18deg) rotateX(4deg) rotateZ(2deg) translateY(0); }
    50% { transform: perspective(900px) rotateY(-18deg) rotateX(4deg) rotateZ(2deg) translateY(-12px); }
    100%{ transform: perspective(900px) rotateY(-18deg) rotateX(4deg) rotateZ(2deg) translateY(0); }
  }
  @keyframes mvp-f1 {
    0%  {transform:translateY(0px) rotate(-1deg)}
    28% {transform:translateY(-16px) rotate(0.8deg)}
    55% {transform:translateY(-7px) rotate(-0.4deg)}
    78% {transform:translateY(-21px) rotate(1deg)}
    100%{transform:translateY(0px) rotate(-1deg)}
  }
  @keyframes mvp-f2 {
    0%  {transform:translateY(0px) rotate(1.2deg)}
    32% {transform:translateY(-20px) rotate(-0.8deg)}
    60% {transform:translateY(-9px) rotate(0.6deg)}
    85% {transform:translateY(-24px) rotate(-1deg)}
    100%{transform:translateY(0px) rotate(1.2deg)}
  }
  @keyframes mvp-f3 {
    0%  {transform:translateY(0px) rotate(-0.5deg)}
    22% {transform:translateY(-18px) rotate(1deg)}
    50% {transform:translateY(-28px) rotate(-0.7deg)}
    75% {transform:translateY(-10px) rotate(0.5deg)}
    100%{transform:translateY(0px) rotate(-0.5deg)}
  }
  @keyframes mvp-f4 {
    0%  {transform:translateY(0px) rotate(0.8deg)}
    40% {transform:translateY(-13px) rotate(-1deg)}
    68% {transform:translateY(-22px) rotate(0.6deg)}
    90% {transform:translateY(-5px) rotate(-0.8deg)}
    100%{transform:translateY(0px) rotate(0.8deg)}
  }

  .mvp-sp {
    position:absolute; border-radius:50%; background:#10b981;
    animation: mvp-sparkle var(--d,2.8s) ease-in-out infinite;
    animation-delay:var(--dl,0s); opacity:0; pointer-events:none;
  }
  .mvp-star {
    position:absolute; width:10px; height:10px;
    animation: mvp-sparkle var(--d,3s) ease-in-out infinite;
    animation-delay:var(--dl,0s); opacity:0; pointer-events:none;
  }
  .mvp-star::before,.mvp-star::after {
    content:''; position:absolute; background:rgba(255,255,255,0.85); border-radius:2px;
  }
  .mvp-star::before{width:2px;height:100%;left:50%;transform:translateX(-50%)}
  .mvp-star::after{width:100%;height:2px;top:50%;transform:translateY(-50%)}

  .mvp-phone-wrap {
    position:relative; width:280px; height:572px;
    animation: mvp-phoneFloat 6s ease-in-out infinite;
    z-index:5; flex-shrink:0;
  }
  .mvp-phone-outer {
    width:100%; height:100%; border-radius:52px;
    background:linear-gradient(160deg,#dde5e2 0%,#bec8c4 100%);
    padding:4px;
    box-shadow:0 50px 110px rgba(0,0,0,.28),0 12px 36px rgba(0,0,0,.15),
      inset 0 1px 0 rgba(255,255,255,.7),8px 0 22px rgba(0,0,0,.12);
  }
  .mvp-phone-inner { width:100%;height:100%;border-radius:50px;background:#0d1f1a;overflow:hidden;position:relative; }
  .mvp-screen { position:absolute;inset:0;background:#f5fffe;border-radius:45px;overflow:hidden;padding:16px 14px 0; }
  .mvp-notch { position:absolute;top:12px;left:50%;transform:translateX(-50%);width:97px;height:22px;background:#0d1f1a;border-radius:12px;z-index:10; }
  .mvp-btn-r  { position:absolute;right:-4px;top:122px;width:4px;height:68px;background:#b0bcb8;border-radius:2px; }
  .mvp-btn-l1 { position:absolute;left:-4px;top:97px;width:4px;height:34px;background:#b0bcb8;border-radius:2px; }
  .mvp-btn-l2 { position:absolute;left:-4px;top:144px;width:4px;height:54px;background:#b0bcb8;border-radius:2px; }

  .mvp-sc-body { padding-top:44px; }
  .mvp-sc-label { font-size:12px;font-weight:700;color:#0d1f1a;display:flex;justify-content:space-between;margin-bottom:9px; }
  .mvp-sc-label span { color:#10b981; }
  .mvp-sc-row { background:white;border-radius:14px;padding:10px 13px;display:flex;align-items:center;gap:10px;margin-bottom:8px;border:0.5px solid #e2eeea; }
  .mvp-sc-ico { width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .mvp-sc-t { font-size:12px;font-weight:700;color:#0d1f1a; }
  .mvp-sc-s { font-size:10px;color:#9ab5ad;margin-top:2px; }
  .mvp-sc-d { font-size:10px;color:#9ab5ad;margin-left:auto; }
  .mvp-div { height:0.5px;background:#e8f0ee;margin:10px 0; }
  .mvp-home-bar { position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:68px;height:4px;background:#c0d0cc;border-radius:2px; }
  .mvp-bottom-nav { position:absolute;bottom:0;left:0;right:0;height:64px;background:white;border-top:0.5px solid #e8f0ee;display:flex;align-items:center;justify-content:space-around;border-radius:0 0 45px 45px; }
`;

function PhoneScreen() {
  return (
    <div className="mvp-screen">
      <div className="mvp-notch" />
      <div className="mvp-sc-body">
        <div className="mvp-sc-label">
          Recent Reports <span>›</span>
        </div>
        <div className="mvp-sc-row">
          <div className="mvp-sc-ico" style={{ background: "#d1fae5" }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            >
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
          <div className="mvp-sc-ico" style={{ background: "#dbeafe" }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            >
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <div className="mvp-nav-dot" />
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ab5ad"
          strokeWidth="2"
          opacity="0.6"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ab5ad"
          strokeWidth="2"
          opacity="0.6"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ab5ad"
          strokeWidth="2"
          opacity="0.6"
        >
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

export default function Mobile({ isVisible = true }) {
  const isMobile = useIsNarrow(768);
  const sceneRef = useRef(null);
  const { rawX, rawY } = useParallax(sceneRef);

  const phoneX = useTransform(rawX, (v) => v * 10);
  const phoneY = useTransform(rawY, (v) => v * 8);
  const phoneRotY = useTransform(rawX, (v) => -18 + v * 6);
  const phoneRotX = useTransform(rawY, (v) => 4 + v * 4);

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={sceneRef}
        style={{
          width: "100%",
          minHeight: isMobile ? 580 : 820,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "visible",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        >
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
            }}
          />
        ))}
        {STARS.map((s, i) => (
          <div
            key={`s${i}`}
            className="mvp-star"
            style={{ top: s.top, left: s.left, right: s.right, "--d": s.d, "--dl": s.dl }}
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
    </>
  );
}
