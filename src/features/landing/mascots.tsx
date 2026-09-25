"use client";

/**
 * Stitch mascot SVGs (App.jsx:49–224) ported to TSX.
 * Colours resolve through tokens / the `--mascot-*` illustration vars in globals.css
 * (never raw hex — `src/features/**` is hex-lint-forbidden). `@keyframes float` lives
 * in globals.css, so `animation` strings stay colour-free.
 */

/* eslint-disable @next/next/no-img-element */

type MascotProps = {
  delay?: string;
};

export function DoctorMascot({
  color = "var(--color-primary)",
  flipped = false,
  delay = "0s",
}: MascotProps & { color?: string; flipped?: boolean }) {
  return (
    <div
      style={{
        animation: "float 3s ease-in-out infinite",
        animationDelay: delay,
        transform: flipped ? "scaleX(-1)" : "none",
        display: "inline-block",
      }}
    >
      <svg width="120" height="170" viewBox="0 0 110 160" fill="none">
        <rect x="25" y="80" width="60" height="65" rx="18" opacity="0.92" style={{ fill: color }} />
        <rect x="30" y="85" width="50" height="60" rx="14" fill="white" opacity="0.15" />
        <ellipse cx="55" cy="55" rx="28" ry="30" fill="var(--mascot-skin)" />
        <ellipse cx="55" cy="30" rx="28" ry="14" fill="var(--color-ink-800)" />
        <ellipse cx="44" cy="52" rx="4" ry="4.5" fill="white" />
        <ellipse cx="66" cy="52" rx="4" ry="4.5" fill="white" />
        <ellipse cx="44" cy="53" rx="2.2" ry="2.5" fill="var(--color-ink-800)" />
        <ellipse cx="66" cy="53" rx="2.2" ry="2.5" fill="var(--color-ink-800)" />
        <path
          d="M44 65 Q55 73 66 65"
          stroke="var(--mascot-mouth)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M38 100 Q30 115 38 125 Q48 135 55 128"
          stroke="var(--color-ink-800)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="55"
          cy="128"
          r="5"
          stroke="var(--color-ink-800)"
          strokeWidth="1.5"
          style={{ fill: color }}
        />
        <rect x="62" y="95" width="22" height="28" rx="4" fill="white" opacity="0.95" />
        <rect x="65" y="99" width="16" height="2" rx="1" style={{ fill: color }} />
        <rect x="65" y="104" width="12" height="2" rx="1" fill="var(--color-border-strong)" />
        <rect x="65" y="109" width="14" height="2" rx="1" fill="var(--color-border-strong)" />
        <rect x="33" y="138" width="18" height="18" rx="8" opacity="0.85" style={{ fill: color }} />
        <rect x="59" y="138" width="18" height="18" rx="8" opacity="0.85" style={{ fill: color }} />
        <ellipse cx="42" cy="156" rx="12" ry="5" fill="var(--color-ink-800)" />
        <ellipse cx="68" cy="156" rx="12" ry="5" fill="var(--color-ink-800)" />
      </svg>
    </div>
  );
}

export function RobotMascot({
  color = "var(--color-violet)",
  delay = "0.5s",
  cuter = false,
}: MascotProps & { color?: string; cuter?: boolean }) {
  return (
    <div
      style={{
        animation: "float 3.5s ease-in-out infinite",
        animationDelay: delay,
        display: "inline-block",
      }}
    >
      <svg width="120" height="155" viewBox="0 0 100 150" fill="none">
        <rect x="48" y="5" width="4" height="15" rx="2" style={{ fill: color }} />
        <circle cx="50" cy="5" r="6" style={{ fill: color }}>
          <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <rect
          x="15"
          y="20"
          width="70"
          height="55"
          rx="22"
          fill="var(--color-ink-800)"
          stroke={color}
          strokeWidth="2.5"
        />
        <rect x="20" y="25" width="60" height="45" rx="16" fill="var(--color-ink-900)" />
        <g>
          <circle cx="36" cy="45" r="9" opacity="0.9" style={{ fill: color }}>
            <animate
              attributeName="opacity"
              values="0.9;0.4;0.9"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="64" cy="45" r="9" opacity="0.9" style={{ fill: color }}>
            <animate
              attributeName="opacity"
              values="0.9;0.4;0.9"
              dur="3s"
              repeatCount="indefinite"
            />
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
            <circle cx="28" cy="55" r="4" fill="var(--color-magenta)" opacity="0.4" />
            <circle cx="72" cy="55" r="4" fill="var(--color-magenta)" opacity="0.4" />
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
          fill="var(--color-ink-800)"
          stroke={color}
          strokeWidth="2"
        />
        <rect x="30" y="85" width="40" height="25" rx="10" fill="var(--color-ink-900)" />
        <path
          d="M46 92 Q50 88 54 92 Q58 96 50 102 Q42 96 46 92"
          opacity="0.8"
          style={{ fill: color }}
        >
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </path>
        <rect
          x="4"
          y="82"
          width="14"
          height="35"
          rx="7"
          fill="var(--color-ink-800)"
          stroke={color}
          strokeWidth="1.5"
        />
        <rect
          x="82"
          y="82"
          width="14"
          height="35"
          rx="7"
          fill="var(--color-ink-800)"
          stroke={color}
          strokeWidth="1.5"
        />
        <rect
          x="28"
          y="125"
          width="18"
          height="15"
          rx="7"
          fill="var(--color-ink-800)"
          stroke={color}
          strokeWidth="2"
        />
        <rect
          x="54"
          y="125"
          width="18"
          height="15"
          rx="7"
          fill="var(--color-ink-800)"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

export function NurseMascot({ delay = "1s" }: MascotProps) {
  return (
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
          stroke="var(--color-primary)"
          strokeWidth="1.5"
        />
        <rect
          x="42"
          y="10"
          width="16"
          height="14"
          rx="4"
          fill="white"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
        />
        <rect x="47" y="13" width="6" height="8" rx="1" fill="var(--color-primary)" />
        <rect x="44" y="16" width="12" height="2" rx="1" fill="var(--color-primary)" />
        <ellipse cx="50" cy="46" rx="26" ry="27" fill="var(--mascot-skin)" />
        <ellipse cx="40" cy="44" rx="3.5" ry="4" fill="white" />
        <ellipse cx="60" cy="44" rx="3.5" ry="4" fill="white" />
        <ellipse cx="40" cy="45" rx="2" ry="2.3" fill="var(--color-ink-800)" />
        <ellipse cx="60" cy="45" rx="2" ry="2.3" fill="var(--color-ink-800)" />
        <ellipse cx="32" cy="52" rx="6" ry="4" fill="var(--mascot-blush)" opacity="0.5" />
        <ellipse cx="68" cy="52" rx="6" ry="4" fill="var(--mascot-blush)" opacity="0.5" />
        <path
          d="M40 57 Q50 65 60 57"
          stroke="var(--mascot-mouth)"
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
          stroke="var(--color-primary)"
          strokeWidth="1.5"
        />
        <rect
          x="28"
          y="80"
          width="44"
          height="54"
          rx="12"
          fill="var(--color-primary)"
          opacity="0.1"
        />
        <rect
          x="44"
          y="78"
          width="12"
          height="30"
          rx="3"
          fill="white"
          stroke="var(--color-primary)"
          strokeWidth="1"
        />
        <rect x="44" y="88" width="12" height="3" rx="1" fill="var(--color-primary)" />
        <rect x="47" y="83" width="3" height="12" rx="1" fill="var(--color-primary)" />
        <rect
          x="58"
          y="90"
          width="24"
          height="18"
          rx="5"
          fill="var(--color-primary-soft)"
          stroke="var(--color-primary)"
          strokeWidth="1"
        />
        <circle cx="64" cy="96" r="3" fill="var(--color-primary)" />
        <circle cx="74" cy="96" r="3" fill="var(--color-magenta)" />
        <circle cx="64" cy="103" r="3" fill="var(--color-secondary)" />
        <circle cx="74" cy="103" r="3" fill="var(--mascot-violet-soft)" />
        <rect
          x="28"
          y="128"
          width="18"
          height="22"
          rx="8"
          fill="var(--color-primary)"
          opacity="0.8"
        />
        <rect
          x="54"
          y="128"
          width="18"
          height="22"
          rx="8"
          fill="var(--color-primary)"
          opacity="0.8"
        />
        <ellipse cx="37" cy="150" rx="12" ry="5" fill="var(--color-ink-800)" />
        <ellipse cx="63" cy="150" rx="12" ry="5" fill="var(--color-ink-800)" />
      </svg>
    </div>
  );
}

export function PrescriptionMascot({ delay = "0s" }: MascotProps) {
  return (
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
        src="/landing/how-it-works/prescription.png"
        alt="Medical profile illustration with prescription clipboard, DNA helix, cross, and medications"
        width={200}
        height={200}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}

export function AIRobotReadingMascot({ delay = "0.5s" }: MascotProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width: 190,
        maxWidth: "100%",
        paddingBottom: 12,
      }}
    >
      <div style={{ animation: "float 3.5s ease-in-out infinite", animationDelay: delay }}>
        <img
          src="/landing/how-it-works/ai-doctor.png"
          alt="Friendly AI doctor assistant presenting analyzed health data"
          width={190}
          height={190}
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
}

export function ReminderMascot({ delay = "1s" }: MascotProps) {
  return (
    <div
      style={{
        animation: "float 4s ease-in-out infinite",
        animationDelay: delay,
        display: "inline-block",
      }}
    >
      <img
        src="/landing/how-it-works/reminders-mobile.png"
        alt="Smartphone showing smart medication reminders and sugar tablet alerts"
        width={200}
        height={200}
        style={{ width: 200, maxWidth: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}
