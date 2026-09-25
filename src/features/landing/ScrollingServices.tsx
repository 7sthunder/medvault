"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SERVICES = ["Medical Reports", "Reminders", "AI Insights", "Nearby Services"];

export default function ScrollingServices() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SERVICES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: "inline-block",
        height: 24,
        overflow: "hidden",
        verticalAlign: "middle",
        marginLeft: 6,
        position: "relative",
        minWidth: 160,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={SERVICES[index]}
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -22, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="font-heading text-primary text-base font-bold whitespace-nowrap"
          style={{ lineHeight: "24px" }}
        >
          {SERVICES[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
