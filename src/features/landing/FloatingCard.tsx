"use client";

import { motion } from "framer-motion";

/**
 * Stitch `FloatingCard.jsx` — large glass card that emerges over the phone mockup.
 * Recipe-only in the landing (Stitch never mounts it at runtime either; it lives for
 * hero/auth compositions). Renders through the `.glass-card` recipe colours (runtime
 * animated via framer-motion, no inline colour literals).
 */
export default function FloatingCard({
  icon,
  title,
  description,
  delay = 0,
  rotateDeg = 0,
  isMobile,
  isVisible,
  emphasis = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  rotateDeg?: number;
  isMobile: boolean;
  isVisible: boolean;
  emphasis?: boolean;
}) {
  const shell = (
    <div className="flex gap-4">
      <div
        className="bg-primary/15 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl [&_svg]:shrink-0"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3
          className={`font-heading font-bold leading-snug text-ink-800 ${emphasis ? "text-base" : "text-[0.95rem]"}`}
        >
          {title}
        </h3>
        <p
          className={`mt-2 leading-relaxed text-ink-600 ${emphasis ? "text-sm" : "text-[0.8125rem]"}`}
        >
          {description}
        </p>
      </div>
    </div>
  );

  const glass = emphasis
    ? "min-w-[260px] max-w-[320px] rounded-2xl border border-white/30 bg-white/20 p-6 backdrop-blur-xl shadow-[0_24px_55px_rgba(0,0,0,0.16)]"
    : "min-w-[240px] max-w-[300px] rounded-2xl border border-white/30 bg-white/20 p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
      transition={{ duration: 0.65, delay: 0.06 + delay * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full ${isMobile ? "mx-auto max-w-[min(100%,320px)]" : ""}`}
    >
      {isMobile ? (
        <div className={glass}>{shell}</div>
      ) : (
        <motion.div
          className={glass}
          style={{ rotate: rotateDeg }}
          animate={isVisible ? { y: [0, -8, 0] } : { y: 0 }}
          transition={{
            repeat: isVisible ? Infinity : 0,
            duration: 5 + delay * 0.12,
            ease: "easeInOut",
            delay: 0.45 + delay * 0.18,
          }}
        >
          {shell}
        </motion.div>
      )}
    </motion.div>
  );
}
