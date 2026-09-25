import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { BRAND, LOGO } from "@shared/brand";

/**
 * The MediTrack mark: the §5.1 emerald→cyan gradient tile with a white capsule.
 *
 * `expo-linear-gradient` ships inside Expo Go, so the brand gradient is the real gradient
 * rather than a flat approximation. The capsule is drawn with plain views (two half-round
 * ends and a rotated body) so there is no SVG or image asset to keep in sync.
 */
export function Logo({ size = LOGO.size }: { size?: number }) {
  const radius = size * (LOGO.radius / LOGO.size);
  const barThickness = size * 0.19;
  const barLength = size * 0.42;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        shadowColor: "#10b981",
        shadowOpacity: 0.25,
        shadowRadius: size * 0.15,
        shadowOffset: { width: 0, height: size * 0.05 },
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={["#10b981", "#06b6d4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <View style={{ transform: [{ rotate: "-45deg" }], flexDirection: "row" }}>
          <View
            style={{
              width: barLength,
              height: barThickness,
              backgroundColor: "#ffffff",
              borderTopLeftRadius: barThickness / 2,
              borderBottomLeftRadius: barThickness / 2,
            }}
          />
          <View
            style={{
              width: barThickness,
              height: barThickness,
              borderRadius: barThickness / 2,
              backgroundColor: "#ffffff",
              opacity: 0.92,
            }}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Wordmark lockup — "Medi" + "Track" in ink, "AI" in brand green (§5.1).
 *
 * Splitting the name rather than colouring the whole word is what the brand guide asks
 * for, and it is the one place a raw string is acceptable (it *is* the product name).
 */
export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text
        style={{
          fontSize: size,
          fontWeight: "700",
          color: "#0f172a",
          letterSpacing: -0.3,
        }}
      >
        {BRAND.wordmark.active}
      </Text>
      <Text style={{ fontSize: size, fontWeight: "700", color: "#10b981", letterSpacing: -0.3 }}>
        {BRAND.wordmark.accent}
      </Text>
    </View>
  );
}

/** Logo + wordmark, used in the tab shell header. */
export function BrandLockup({ size = 34 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Logo size={size} />
      <Wordmark size={size * 0.5} />
    </View>
  );
}
