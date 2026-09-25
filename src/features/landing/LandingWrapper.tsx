"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import SplashScreen from "@/features/landing/SplashScreen";

interface LandingWrapperProps {
  children: React.ReactNode;
}

export default function LandingWrapper({ children }: LandingWrapperProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if user already saw splash in this session
    // Or allow force replay via ?splash=1
    const params = new URLSearchParams(window.location.search);
    const forceSplash = params.get("splash") === "1";
    const hasSeenSplash = sessionStorage.getItem("medvault_splash_seen");

    if (forceSplash || !hasSeenSplash) {
      setShowSplash(true);
    }
    setIsReady(true);
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("medvault_splash_seen", "true");
    setShowSplash(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isReady && !showSplash ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </>
  );
}
