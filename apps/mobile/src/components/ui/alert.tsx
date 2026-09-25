import { View } from "react-native";

import { Ionicons } from "@/lib/icons";
import type { IoniconName } from "@/lib/icons";

import { Row, Txt } from "./primitives";

/**
 * Inline status banner — the phone equivalent of the web `alert` primitive.
 *
 * Lives above the fold in the form rather than as a toast because these messages (bad
 * credentials, a failed save) are attached to the thing that failed; a toast would
 * disappear before it had been read.
 */
export function AlertNote({
  title,
  message,
  tone: toneName = "danger",
  icon,
}: {
  title: string;
  message?: string;
  tone?: "danger" | "warning" | "info" | "success";
  icon?: IoniconName;
}) {
  const palette = {
    danger: { bg: "#fee2e2", fg: "#b91c1c", border: "#fecaca", fallback: "alert-circle" },
    warning: { bg: "#fef3c7", fg: "#b45309", border: "#fde68a", fallback: "warning-outline" },
    info: { bg: "#dbeafe", fg: "#1d4ed8", border: "#bfdbfe", fallback: "information-circle" },
    success: { bg: "#d1fae5", fg: "#047857", border: "#a7f3d0", fallback: "checkmark-circle" },
  } satisfies Record<string, { bg: string; fg: string; border: string; fallback: IoniconName }>;
  const tone = palette[toneName];

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 4,
      }}
    >
      <Row gap={8} align="flex-start">
        <Ionicons name={icon ?? tone.fallback} size={17} color={tone.fg} style={{ marginTop: 1 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="smallStrong" style={{ color: tone.fg }}>
            {title}
          </Txt>
          {message ? (
            <Txt variant="small" style={{ color: tone.fg }}>
              {message}
            </Txt>
          ) : null}
        </View>
      </Row>
    </View>
  );
}
