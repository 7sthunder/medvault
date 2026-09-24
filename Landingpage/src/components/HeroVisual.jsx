import { motion } from "framer-motion";
import { Pill, BellRing, HeartPulse, Clock } from "lucide-react";
import Mobile from "../mobile";

const CSS = `
  .hero-visual-container {
    position: relative;
    width: 100%;
    max-width: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
    margin: 0 auto;
  }
`;

const FloatingNotification = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  time, 
  style, 
  delay = 0, 
  color = "#10b981",
  scale = 1,
  width = "200px"
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 * scale, y: 30 }}
      animate={{ 
        opacity: 1, 
        scale: scale,
        y: [0, -12, 0]
      }}
      transition={{ 
        opacity: { duration: 0.8, delay },
        scale: { duration: 0.8, delay, type: "spring", stiffness: 100 },
        y: { 
          duration: 6, // Synced with mvp-phoneFloat
          repeat: Infinity, 
          ease: "easeInOut", 
          delay: delay 
        }
      }}
      style={{
        position: "absolute",
        zIndex: 20,
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(14px)",
        padding: "14px 18px",
        borderRadius: "22px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 15px 40px rgba(15, 23, 42, 0.1), 0 5px 15px rgba(15, 23, 42, 0.04)",
        border: "1px solid rgba(16, 185, 129, 0.28)", // Greenish outline
        minWidth: width,
        ...style
      }}
    >
      <div style={{ 
        width: "42px", 
        height: "42px", 
        borderRadius: "14px", 
        background: `${color}18`, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexShrink: 0
      }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>{subtitle}</div>
      </div>
      {time && <div style={{ fontSize: "10px", color: "#94a3b8", alignSelf: "flex-start", marginTop: "3px" }}>{time}</div>}
    </motion.div>
  );
};

export default function HeroVisual({ isVisible }) {
  if (!isVisible) return <div className="hero-visual-container" />;

  return (
    <>
      <style>{CSS}</style>
      <div className="hero-visual-container">
        {/* Floating Notifications */}
        <FloatingNotification 
          icon={Pill} 
          title="Medication Reminder" 
          subtitle="Time for Vitamin D3" 
          time="10:00 AM"
          color="#10b981"
          style={{ top: "12%", left: "-22%" }}
          scale={1.15} // Increased size
          width="230px"
          delay={0.4}
        />
        <FloatingNotification 
          icon={HeartPulse} 
          title="Vitals Tracked" 
          subtitle="Resting HR: 68bpm" 
          time="Just now"
          color="#ef4444"
          style={{ bottom: "22%", left: "-15%" }}
          delay={1.0}
        />
        <FloatingNotification 
          icon={Clock} 
          title="Upcoming Visit" 
          subtitle="Dr. Sharma - Cardiology" 
          time="2:30 PM"
          color="#3b82f6"
          style={{ top: "42%", right: "-24%" }} // Swapped position
          scale={1.12} // Increased size
          width="220px"
          delay={1.3}
        />
        <FloatingNotification 
          icon={BellRing} 
          title="Report Ready" 
          subtitle="Blood Analysis Lab" 
          color="#8b5cf6"
          style={{ top: "8%", right: "-12%" }} // Swapped position
          delay={0.7}
        />

        <Mobile isVisible={isVisible} />
      </div>
    </>
  );
}
