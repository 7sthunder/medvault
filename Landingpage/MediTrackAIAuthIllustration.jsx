import { useState, useEffect } from "react";

const EyeOpen = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function MediTrackAIAuthIllustration({ initialMode = "login", onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [showPass, setShowPass] = useState(false);
  const [focus, setFocus] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    setShowPass(false);
  }, [mode]);

  const iStyle = (f) => ({
    width: "100%",
    padding: "16px 18px",
    borderRadius: 14,
    border: `1.5px solid ${focus === f ? "#10b981" : "#e2e8f0"}`,
    background: focus === f ? "white" : "#f8fafc",
    fontSize: 15,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 500,
    color: "#0f172a",
    outline: "none",
    transition: "all 0.25s ease",
    boxShadow: focus === f ? "0 0 0 4px rgba(16,185,129,0.12)" : "none",
    boxSizing: "border-box",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .auth-container {
          width: 100vw;
          height: 100vh;
          display: flex;
          background: white;
        }

        .auth-left {
          display: none;
        }
        
        @media (min-width: 900px) {
          .auth-left {
            display: block;
            flex: 1.1;
            position: relative;
            background: #f8fafc;
            overflow: hidden;
          }
        }

        .auth-right {
          flex: 0.9;
          display: flex;
          flex-direction: column;
          position: relative;
          background: white;
        }

        .auth-scroll-area {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          /* Hide scrollbar for clean look but allow scrolling */
          scrollbar-width: none; 
        }
        .auth-scroll-area::-webkit-scrollbar {
          display: none; 
        }
        
        .auth-content-wrapper {
          margin: auto;
          width: 100%;
          max-width: 460px;
          padding: 60px 40px;
          animation: fadeUp 0.4s ease-out;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero Typography Match */
        .hero-font {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #0f172a;
        }

        .btn-primary {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          background: #10b981;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .btn-primary:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(16,185,129,0.25);
        }
        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-google {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          background: white;
          border: 1.5px solid #e2e8f0;
          color: #1e293b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .btn-google:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .back-btn {
          position: absolute;
          top: 32px;
          right: 32px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          border: 1.5px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 10;
        }
        .back-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
        <div className="auth-container">
          {/* LEFT SIDE: Image */}
          <div className="auth-left">
            <img
              src="/imagessss/login_page.jpeg"
              alt="MediTrack AI"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center bottom",
              }}
            />
            {/* Blend mask at the bottom so it hits the window end seamlessly if needed */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, white 0%, transparent 20%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* RIGHT SIDE: Form */}
          <div className="auth-right">
            {/* Nav Back Button */}
            <button className="back-btn" onClick={onClose} title="Back to Landing Page">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="auth-scroll-area">
              <div className="auth-content-wrapper">
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #10b981, #06b6d4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 16px rgba(16,185,129,0.25)",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    MediTrack<span style={{ color: "#10b981" }}>AI</span>
                  </span>
                </div>

                {/* Hero-matched Headline */}
                <div style={{ marginBottom: 40 }}>
                  <h1
                    className="hero-font"
                    style={{ fontSize: "clamp(40px, 4vw, 56px)", marginBottom: 16 }}
                  >
                    {mode === "login" ? (
                      <>
                        Welcome
                        <br />
                        <span style={{ color: "#10b981" }}>back.</span>
                      </>
                    ) : (
                      <>
                        Create your
                        <br />
                        <span style={{ color: "#10b981" }}>MediTrack AI account.</span>
                      </>
                    )}
                  </h1>
                  <p
                    style={{
                      fontSize: 17,
                      color: "#64748b",
                      fontWeight: 500,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    {mode === "login"
                      ? "Securely access your medical timeline."
                      : "Join thousands protecting their health data."}
                  </p>
                </div>

                {/* Form Elements */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {mode === "signup" && (
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#1e293b",
                          marginBottom: 8,
                        }}
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        style={iStyle("name")}
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        onFocus={() => setFocus("name")}
                        onBlur={() => setFocus(null)}
                      />
                    </div>
                  )}

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1e293b",
                        marginBottom: 8,
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      style={iStyle("email")}
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      onFocus={() => setFocus("email")}
                      onBlur={() => setFocus(null)}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1e293b",
                        marginBottom: 8,
                      }}
                    >
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        style={{ ...iStyle("password"), paddingRight: 56 }}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        onFocus={() => setFocus("password")}
                        onBlur={() => setFocus(null)}
                      />
                      <button
                        onClick={() => setShowPass(!showPass)}
                        tabIndex={-1}
                        style={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                        }}
                      >
                        {showPass ? <EyeOpen /> : <EyeClosed />}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: -4,
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 14,
                        color: "#475569",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{
                          width: 18,
                          height: 18,
                          accentColor: "#10b981",
                          cursor: "pointer",
                          borderRadius: 4,
                        }}
                      />
                      Remember me
                    </label>
                    {mode === "login" && (
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#10b981",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <button className="btn-primary" style={{ marginTop: 8 }}>
                    {mode === "login" ? "Sign in to MediTrack AI" : "Create MediTrack AI account"}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "16px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                    <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                  </div>

                  <button className="btn-google">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 40 }}>
                    <p
                      style={{
                        fontSize: 15,
                        color: "#64748b",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {mode === "login"
                        ? "Don't have a MediTrack AI account? "
                        : "Already have a MediTrack AI account? "}
                      <button
                        onClick={() => setMode(mode === "login" ? "signup" : "login")}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#10b981",
                          fontWeight: 800,
                          fontSize: 15,
                          cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {mode === "login" ? "Sign up" : "Log in"}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
