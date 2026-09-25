export default function MediTrackAIPhoneSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .mvp-scene {
          width: 100%; min-height: 620px;
          background: radial-gradient(ellipse 70% 60% at 55% 50%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.07) 55%, transparent 80%);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

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
          position: absolute; border-radius: 50%; background: #10b981;
          animation: mvp-sparkle var(--d,2.8s) ease-in-out infinite;
          animation-delay: var(--dl,0s); opacity: 0;
        }
        .mvp-star {
          position: absolute; width: 10px; height: 10px;
          animation: mvp-sparkle var(--d,3s) ease-in-out infinite;
          animation-delay: var(--dl,0s); opacity: 0;
        }
        .mvp-star::before,.mvp-star::after {
          content:''; position:absolute; background:rgba(255,255,255,0.85); border-radius:2px;
        }
        .mvp-star::before{width:2px;height:100%;left:50%;transform:translateX(-50%)}
        .mvp-star::after{width:100%;height:2px;top:50%;transform:translateY(-50%)}

        .mvp-phone-wrap {
          position: relative; width: 230px; height: 470px;
          animation: mvp-phoneFloat 6s ease-in-out infinite; z-index: 5; flex-shrink: 0;
        }
        .mvp-phone-outer {
          width:100%;height:100%;border-radius:42px;
          background:linear-gradient(160deg,#dde5e2 0%,#bec8c4 100%);
          padding:3px;
          box-shadow:0 40px 90px rgba(0,0,0,.28),0 10px 30px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.7),6px 0 18px rgba(0,0,0,.12);
        }
        .mvp-phone-inner { width:100%;height:100%;border-radius:40px;background:#0d1f1a;overflow:hidden;position:relative; }
        .mvp-screen { position:absolute;inset:0;background:#f5fffe;border-radius:40px;overflow:hidden;padding:12px 10px 0; }
        .mvp-notch { position:absolute;top:9px;left:50%;transform:translateX(-50%);width:80px;height:18px;background:#0d1f1a;border-radius:9px;z-index:10; }
        .mvp-btn-r { position:absolute;right:-3px;top:100px;width:3px;height:56px;background:#b0bcb8;border-radius:2px; }
        .mvp-btn-l1 { position:absolute;left:-3px;top:80px;width:3px;height:28px;background:#b0bcb8;border-radius:2px; }
        .mvp-btn-l2 { position:absolute;left:-3px;top:118px;width:3px;height:44px;background:#b0bcb8;border-radius:2px; }

        .mvp-sc-body { padding-top:32px; }
        .mvp-sc-label { font-size:9.5px;font-weight:700;color:#0d1f1a;display:flex;justify-content:space-between;margin-bottom:7px; }
        .mvp-sc-label span { color:#10b981; }
        .mvp-sc-row { background:white;border-radius:11px;padding:8px 10px;display:flex;align-items:center;gap:8px;margin-bottom:6px;border:0.5px solid #e2eeea; }
        .mvp-sc-ico { width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .mvp-sc-t { font-size:9.5px;font-weight:700;color:#0d1f1a; }
        .mvp-sc-s { font-size:8px;color:#9ab5ad;margin-top:1px; }
        .mvp-sc-d { font-size:8px;color:#9ab5ad;margin-left:auto; }
        .mvp-div { height:0.5px;background:#e8f0ee;margin:8px 0; }
        .mvp-bottom-nav { position:absolute;bottom:0;left:0;right:0;height:48px;background:white;border-top:0.5px solid #e8f0ee;display:flex;align-items:center;justify-content:space-around;border-radius:0 0 40px 40px; }
        .mvp-nav-dot { width:4px;height:4px;border-radius:50%;background:#10b981;margin:2px auto 0; }
        .mvp-home-bar { position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:50px;height:3px;background:#c0d0cc;border-radius:2px; }

        .mvp-fc {
          position:absolute;
          background:rgba(255,255,255,0.88);
          backdrop-filter:blur(14px);
          -webkit-backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,0.95);
          border-radius:18px;
          box-shadow:0 8px 32px rgba(16,185,129,0.13),0 2px 12px rgba(0,0,0,0.08);
          display:flex;align-items:center;gap:12px;white-space:nowrap;z-index:20;
        }
        .mvp-fc-ico {
          width:40px;height:40px;
          background:linear-gradient(135deg,#d1fae5,#a7f3d0);
          border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .mvp-fc-title { font-size:14px;font-weight:800;color:#0d1f1a;line-height:1.2; }
        .mvp-fc-sub   { font-size:11.5px;color:#6b8a82;margin-top:2px; }
        .mvp-fc-badge { font-size:20px;font-weight:800;color:#0d1f1a;margin-left:auto;padding-left:16px;line-height:1; }
        .mvp-fc-pm    { font-size:10px;color:#6b8a82;font-weight:500; }
        .mvp-snooze   { background:#10b981;color:white;font-size:10px;font-weight:700;padding:3px 18px;border-radius:6px;margin-top:6px;display:inline-block;letter-spacing:.03em; }

        .mvp-c1 { top:9%;right:4%;padding:12px 20px 12px 12px;animation:mvp-f1 4.3s ease-in-out infinite; }
        .mvp-c2 { top:28%;left:3%;padding:11px 18px 11px 11px;animation:mvp-f2 3.8s ease-in-out infinite;animation-delay:.8s; }
        .mvp-c3 { top:44%;right:2%;padding:14px 24px 14px 13px;animation:mvp-f3 4.8s ease-in-out infinite;animation-delay:1.6s; }
        .mvp-c4 { top:62%;left:2%;padding:12px 16px 12px 11px;align-items:flex-start;animation:mvp-f4 5.2s ease-in-out infinite;animation-delay:2.4s; }
      `}</style>

      <div className="mvp-scene">
        {/* Sparkle dots */}
        {[
          { w: 5, h: 5, top: "10%", left: "18%", d: "2.4s", dl: "0s" },
          { w: 4, h: 4, top: "20%", left: "8%", d: "3.1s", dl: "0.6s" },
          { w: 6, h: 6, top: "15%", right: "10%", d: "2.7s", dl: "1.1s" },
          { w: 4, h: 4, top: "35%", left: "5%", d: "3.5s", dl: "0.3s" },
          { w: 5, h: 5, top: "70%", left: "10%", d: "2.9s", dl: "1.7s" },
          { w: 4, h: 4, top: "78%", right: "8%", d: "3.3s", dl: "0.9s" },
          { w: 3, h: 3, top: "85%", left: "30%", d: "2.5s", dl: "1.4s" },
          { w: 5, h: 5, top: "88%", right: "22%", d: "3.7s", dl: "0.2s" },
          { w: 3, h: 3, top: "55%", right: "5%", d: "2.6s", dl: "2s" },
        ].map((s, i) => (
          <div
            key={i}
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

        {/* Star sparkles */}
        {[
          { top: "8%", left: "30%", d: "3.2s", dl: "0.5s" },
          { top: "22%", right: "15%", d: "2.8s", dl: "1.3s" },
          { top: "60%", left: "7%", d: "3.6s", dl: "0.7s" },
          { top: "75%", right: "12%", d: "2.9s", dl: "1.9s" },
          { top: "90%", left: "55%", d: "3.4s", dl: "0.4s" },
        ].map((s, i) => (
          <div
            key={i}
            className="mvp-star"
            style={{ top: s.top, left: s.left, right: s.right, "--d": s.d, "--dl": s.dl }}
          />
        ))}

        {/* Phone */}
        <div className="mvp-phone-wrap">
          <div className="mvp-phone-outer">
            <div className="mvp-phone-inner">
              <div className="mvp-btn-r" />
              <div className="mvp-btn-l1" />
              <div className="mvp-btn-l2" />
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
            </div>
          </div>
        </div>

        {/* Card 1 — AI Insight */}
        <div className="mvp-fc mvp-c1">
          <div className="mvp-fc-ico">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.8"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7 2H9l-.7-2A7 7 0 0 1 5 9a7 7 0 0 1 7-7z" />
              <line x1="9" y1="21" x2="15" y2="21" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </svg>
          </div>
          <div>
            <div className="mvp-fc-title">AI Insight</div>
            <div className="mvp-fc-sub">Low Vitamin D detected</div>
          </div>
        </div>

        {/* Card 2 — Report Upload */}
        <div className="mvp-fc mvp-c2">
          <div className="mvp-fc-ico">
            <svg
              width="18"
              height="18"
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
            <div className="mvp-fc-title">Report Upload</div>
            <div className="mvp-fc-sub">Blood Test Uploaded</div>
          </div>
        </div>

        {/* Card 3 — Medicine Reminder */}
        <div className="mvp-fc mvp-c3">
          <div className="mvp-fc-ico" style={{ width: 46, height: 46, borderRadius: 13 }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            >
              <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div>
            <div className="mvp-fc-title" style={{ fontSize: 16 }}>
              Medicine reminder
            </div>
            <div className="mvp-fc-sub" style={{ fontSize: 13 }}>
              Take Paracetamol — 8:00 PM
            </div>
          </div>
        </div>

        {/* Card 4 — Report Upload + snooze + badge */}
        <div className="mvp-fc mvp-c4">
          <div className="mvp-fc-ico" style={{ marginTop: 2 }}>
            <svg
              width="18"
              height="18"
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
          <div style={{ flex: 1 }}>
            <div className="mvp-fc-title">Report Upload</div>
            <div className="mvp-fc-sub">Blood Test Uploaded</div>
            <div className="mvp-snooze">Snooze</div>
          </div>
          <div style={{ textAlign: "right", paddingLeft: 12 }}>
            <div className="mvp-fc-badge">
              8:00 <span className="mvp-fc-pm">PM</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
