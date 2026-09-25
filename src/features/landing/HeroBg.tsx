"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Animated hero background:
 *  - AI-generated cinematic image (hero-bg.jpg) as base
 *  - CSS canvas with flowing particle overlay
 *  - Parallax on scroll
 *  - Slow zoom/pan animation
 */
export default function HeroBg() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <motion.div
      ref={containerRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* The cinematic background image */}
      <motion.div
        style={{
          position: "absolute",
          inset: "-10%",
          y,
          opacity,
        }}
      >
        {/* Slow Ken Burns zoom */}
        <motion.div
          animate={{
            scale: [1, 1.06, 1.04, 1.08, 1],
            x: [0, -8, 4, -4, 0],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/hero-bg.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.22,
          }}
        />
      </motion.div>

      {/* Primary emerald glow */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.45, 0.65, 0.45],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "55%",
          height: "70%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.06) 50%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />
      {/* Secondary cyan glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute",
          bottom: "5%",
          left: "-5%",
          width: "40%",
          height: "55%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(6,182,212,0.10) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </motion.div>
  );
}
