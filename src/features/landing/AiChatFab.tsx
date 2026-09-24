"use client";

import { motion } from "framer-motion";
import { Ambulance } from "lucide-react";
import Link from "next/link";

import { useInView } from "@/features/landing/use-in-view";

/* Port of `App.jsx:1221–1297` (AiChatFab) → routes to `/help`. */
export default function AiChatFab() {
  const [fabRef, fabIn] = useInView<HTMLDivElement>();

  return (
    <div ref={fabRef}>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: fabIn ? 1 : 0, scale: fabIn ? 1 : 0, rotate: fabIn ? [0, -8, 8, 0] : 0 }}
        transition={{
          duration: 0.45,
          delay: 0.35,
          rotate: { duration: 0.6, repeat: fabIn ? Infinity : 0, repeatDelay: 2.4, ease: "easeInOut" },
          type: "spring",
          stiffness: 260,
          damping: 15,
        }}
        className="shadow-fab fixed right-6 bottom-6 z-[210] flex h-[56px] items-center gap-2 rounded-[16px] bg-gradient-to-br from-primary to-primary-dark px-5 text-white"
      >
        <Link
          href="/help"
          className="flex items-center gap-2 text-sm font-bold text-white"
          aria-label="AI Health Assistant"
        >
          <Ambulance size={21} aria-hidden />
          <span className="hidden sm:inline">Ask AI</span>
        </Link>
      </motion.div>
    </div>
  );
}