import type { Metadata } from "next";

import AiChatFab from "@/features/landing/AiChatFab";
import Features from "@/features/landing/Features";
import FinalCta from "@/features/landing/FinalCta";
import Footer from "@/features/landing/Footer";
import Hero from "@/features/landing/Hero";
import HowItWorks from "@/features/landing/HowItWorks";
import Nav from "@/features/landing/Nav";
import Testimonials from "@/features/landing/Testimonials";
import { BRAND } from "@/shared/brand";

export const metadata: Metadata = {
  title: `${BRAND.name} — AI Smart Medical Adherence & Tracker`,
  description: `${BRAND.name} brings your medical records, medicine schedules, appointments, and AI-powered health guidance into one beautifully simple, secure platform.`,
};

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
      <AiChatFab />
    </>
  );
}
