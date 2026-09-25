import type { MedicationStatus } from "@shared/enums";
import type { DoseEventDTO } from "@shared/types";
import { formatInstant } from "@format";
import { Pressable, StyleSheet, View } from "react-native";

import { Ionicons } from "@/lib/icons";
import { statusView } from "@/lib/status";
import { useTheme } from "@/theme/provider";

import { Badge, Button, Row, Txt } from "./ui/primitives";

/** Relative tag next to the wall clock: `"in 2h"` / `"32m ago"` / `"now"`. */
function relativeTag(instant: Date, now: Date): string {
  const minutes = Math.round((instant.getTime() - now.getTime()) / 60_000);
  if (Math.abs(minutes) < 1) return "now";
  const abs = Math.abs(minutes);
  const unit = abs >= 60 ? `${Math.round(abs / 60)}h` : `${abs}m`;
  return minutes > 0 ? `in ${unit}` : `${unit} ago`;
}

export interface DoseCardProps {
  dose: DoseEventDTO;
  medStatus: MedicationStatus;
  timeZone: string;
  now: Date;
  onTake: (dose: DoseEventDTO) => void;
  onSnooze: (dose: DoseEventDTO) => void;
  onSkip: (dose: DoseEventDTO) => void;
  onOpen?: (dose: DoseEventDTO) => void;
  busy?: boolean;
  /**
   * Phone affordance: the action row is three full-width buttons, which eats a lot of
   * vertical space in a feed. On the dashboard the hero shows them; list rows collapse to
   * a single primary action plus an overflow sheet.
   */
  compactActions?: boolean;
}

/**
 * Port of the web `§11.7` dose row, on a phone.
 *
 * Kept deliberately close to the web version: medication colour dot, status chip per §12,
 * and actions only while the dose is actionable. The one real change is ergonomics —
 * a tap target on a phone should be at least 44pt, so the action row wraps to full-width
 * buttons rather than the web's inline `sm` pills.
 */
export function DoseCard({
  dose,
  medStatus,
  timeZone,
  now,
  onTake,
  onSnooze,
  onSkip,
  onOpen,
  busy,
  compactActions,
}: DoseCardProps) {
  const { colors, radius } = useTheme();
  const { scheduledFor, status } = dose;
  const view = statusView(status);
  const tag = relativeTag(scheduledFor, now);

  const actionDisabled = medStatus !== "active" || busy;
  const showActions =
    (status === "due-now" || status === "snoozed" || status === "upcoming") &&
    medStatus === "active";
  const snoozed = status === "snoozed";
  const overdue = status === "due-now";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: overdue ? colors.red + "55" : colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <Pressable
        onPress={() => onOpen?.(dose)}
        accessibilityRole={onOpen ? "button" : undefined}
        accessibilityLabel={`${dose.medication.name}, ${view.aria}, ${formatInstant(scheduledFor, timeZone)}`}
        style={styles.head}
      >
        <View style={[styles.dot, { backgroundColor: dose.medication.color }]} />
        <View style={styles.flex}>
          <Row gap={8} align="flex-start">
            <Txt variant="bodyStrong" numberOfLines={1} style={styles.flex}>
              {dose.medication.name}
            </Txt>
            <Badge label={view.label} icon={view.icon} fg={view.fg} bg={view.bg} />
          </Row>
          <Row gap={6} style={{ marginTop: 2 }}>
            <Txt variant="small" tone="muted">
              {formatInstant(scheduledFor, timeZone)}
            </Txt>
            <Txt variant="small" tone="subtle">
              ·
            </Txt>
            <Txt
              variant="smallStrong"
              tone={overdue ? "danger" : snoozed ? "default" : "muted"}
              style={snoozed ? { color: colors.amber } : undefined}
            >
              {overdue ? tag : snoozed ? "Snoozed" : tag}
            </Txt>
          </Row>
          {snoozed && dose.snoozeUntil ? (
            <Txt variant="caption" style={{ color: colors.amber, marginTop: 2 }}>
              {`Snoozed until ${formatInstant(dose.snoozeUntil, timeZone)}`}
            </Txt>
          ) : null}
        </View>
        {onOpen ? <Ionicons name="chevron-forward" size={16} color={colors.ink400} /> : null}
      </Pressable>

      {showActions ? (
        compactActions ? (
          <Row gap={8} style={styles.actions}>
            <Button
              label="Mark taken"
              size="sm"
              icon="checkmark"
              onPress={() => onTake(dose)}
              disabled={actionDisabled}
              style={styles.flex}
            />
            <Button
              label={snoozed ? "More" : "Snooze"}
              size="sm"
              variant="outline"
              onPress={() => onSnooze(dose)}
              disabled={actionDisabled}
            />
            <Button
              label="Skip"
              size="sm"
              variant="ghost"
              onPress={() => onSkip(dose)}
              disabled={actionDisabled}
            />
          </Row>
        ) : (
          <View style={styles.actions}>
            <Button
              label="Mark taken"
              icon="checkmark"
              onPress={() => onTake(dose)}
              disabled={actionDisabled}
              loading={busy}
            />
            <Row gap={8}>
              <Button
                label={snoozed ? "Snooze more" : "Snooze"}
                icon="alarm-outline"
                variant="outline"
                onPress={() => onSnooze(dose)}
                disabled={actionDisabled}
                style={styles.flex}
              />
              <Button
                label="Skip"
                variant="ghost"
                onPress={() => onSkip(dose)}
                disabled={actionDisabled}
                style={styles.flex}
              />
            </Row>
          </View>
        )
      ) : medStatus === "paused" && status !== "canceled" ? (
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
          Schedule paused — resume from the medication.
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  actions: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
});
