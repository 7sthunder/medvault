import { motion } from "framer-motion";

/**
 * Large glass card for hero — emerges over phone mockup.
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
}) {
  const glass =
    "min-w-[240px] max-w-[300px] rounded-2xl border border-white/30 bg-white/20 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl font-['Plus_Jakarta_Sans',system-ui,sans-serif]";

  const glassLg =
    "min-w-[260px] max-w-[320px] rounded-2xl border border-white/30 bg-white/20 p-6 shadow-[0_24px_55px_rgba(0,0,0,0.16)] backdrop-blur-xl font-['Plus_Jakarta_Sans',system-ui,sans-serif]";

  const shell = (
    <div className="flex gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 [&_svg]:shrink-0"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3
          className={`font-bold leading-snug text-slate-800 font-['Plus_Jakarta_Sans',system-ui,sans-serif] ${emphasis ? "text-base" : "text-[0.95rem]"}`}
        >
          {title}
        </h3>
        <p
          className={`mt-2 leading-relaxed text-slate-600 font-['Plus_Jakarta_Sans',system-ui,sans-serif] ${emphasis ? "text-sm" : "text-[0.8125rem]"}`}
        >
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={
        isVisible
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 36 }
      }
      transition={{
        duration: 0.65,
        delay: 0.06 + delay * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`w-full ${isMobile ? "max-w-[min(100%,320px)] mx-auto" : ""}`}
    >
      {isMobile ? (
        <div className={emphasis ? glassLg : glass}>{shell}</div>
      ) : (
        <motion.div
          className={emphasis ? glassLg : glass}
          style={{ rotate: rotateDeg }}
          animate={
            isVisible
              ? { y: [0, -8, 0] }
              : { y: 0 }
          }
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
