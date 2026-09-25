import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PressableProps, StyleProp, TextProps, TextStyle, ViewProps, ViewStyle } from "react-native";

import { Ionicons } from "@/lib/icons";
import type { IoniconName } from "@/lib/icons";
import { useTheme } from "@/theme/provider";
import type { TypographyVariant } from "@/theme/tokens";

/* ── Text ───────────────────────────────────────────────────────────────────── */

export type TxtTone =
  | "default"
  | "muted"
  | "subtle"
  | "primary"
  | "danger"
  | "inverse"
  | "ink";

export interface TxtProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TxtTone;
  center?: boolean;
}

/**
 * Every string in the app renders through this, so the type scale and colour roles stay
 * consistent. `variant` maps 1:1 onto the `typography` token; `tone` maps onto palette
 * roles so a component never hardcodes a hex.
 */
export function Txt({
  variant = "body",
  tone = "default",
  center,
  style,
  ...rest
}: TxtProps) {
  const { colors, typography } = useTheme();
  const toneColor: Record<TxtTone, string> = {
    default: colors.foreground,
    muted: colors.mutedForeground,
    subtle: colors.ink400,
    primary: colors.primaryDark,
    danger: colors.red,
    inverse: colors.primaryForeground,
    ink: colors.ink900,
  };

  return (
    <Text
      {...rest}
      style={[
        typography[variant] as TextStyle,
        { color: toneColor[tone] },
        center && { textAlign: "center" },
        style,
      ]}
    />
  );
}

/* ── Layout ─────────────────────────────────────────────────────────────────── */

export function Stack({
  gap = 0,
  style,
  children,
  ...rest
}: ViewProps & { gap?: number }) {
  return (
    <View {...rest} style={[gap > 0 && { gap }, style]}>
      {children}
    </View>
  );
}

export function Row({
  gap = 0,
  align = "center",
  justify = "flex-start",
  wrap,
  style,
  children,
  ...rest
}: ViewProps & {
  gap?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  wrap?: boolean;
}) {
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: "row",
          alignItems: align,
          justifyContent: justify,
          gap,
          flexWrap: wrap ? "wrap" : "nowrap",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Full-bleed page padding that respects the device safe area. */
export function Screen({ style, children, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[styles.screen, style]}>
      {children}
    </View>
  );
}

export function Divider({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return <View {...rest} style={[styles.divider, { backgroundColor: colors.border }, style]} />;
}

/** §11 section label: small, uppercase, muted, with an optional green caret. */
export function SectionLabel({
  children,
  style,
  action,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  action?: ReactNode;
}) {
  return (
    <View style={[styles.sectionLabel, style]}>
      <Txt variant="overline" tone="muted" style={styles.flex}>
        {String(children).toUpperCase()}
      </Txt>
      {action}
    </View>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────────── */

export interface CardProps extends ViewProps {
  padded?: boolean;
  /** Adds the §5.4 `shadow-card` lift. Off for cards nested inside another card. */
  raised?: boolean;
}

export function Card({ padded = true, raised = true, style, children, ...rest }: CardProps) {
  const { colors, radius, shadows } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: padded ? 16 : 0,
        },
        raised && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ── Badge / chip ───────────────────────────────────────────────────────────── */

export interface BadgeProps {
  label: string;
  icon?: IoniconName;
  fg?: string;
  bg?: string;
  /** A leading dot instead of an icon — used for unread/active states. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function Badge({ label, icon, fg, bg, dot, style, compact }: BadgeProps) {
  const { colors, radius } = useTheme();
  const fgColor = fg ?? colors.mutedForeground;
  const bgColor = bg ?? colors.muted;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderRadius: radius.pill,
          paddingVertical: compact ? 2 : 4,
          paddingHorizontal: compact ? 8 : 10,
        },
        style,
      ]}
    >
      {dot ? <View style={[styles.badgeDot, { backgroundColor: fgColor }]} /> : null}
      {icon ? <Ionicons name={icon} size={compact ? 11 : 13} color={fgColor} /> : null}
      <Text style={[styles.badgeText, { color: fgColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ── Icon tile (medication avatar) ──────────────────────────────────────────── */

export function IconTile({
  icon,
  size = 44,
  radius: tileRadius = 14,
  fg,
  bg,
  style,
}: {
  icon?: IoniconName;
  size?: number;
  radius?: number;
  fg: string;
  bg: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: tileRadius,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Ionicons name={icon ?? "medkit-outline"} size={size * 0.5} color={fg} />
    </View>
  );
}

/* ── Button ─────────────────────────────────────────────────────────────────── */

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IoniconName;
  iconRight?: IoniconName;
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<ButtonSize, { height: number; px: number; variant: TypographyVariant }> = {
  sm: { height: 36, px: 12, variant: "smallStrong" },
  md: { height: 44, px: 16, variant: "bodyStrong" },
  lg: { height: 54, px: 22, variant: "subheading" },
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  full,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors, radius, typography, shadows } = useTheme();
  const dim = dimensions(variant, colors);
  const fg = fgFor(variant, colors);
  const isDisabled = disabled || loading;
  const spec = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [
        {
          height: spec.height,
          paddingHorizontal: spec.px,
          borderRadius: radius.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: dim.bg,
          borderWidth: dim.border,
          borderColor: dim.borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: full ? "stretch" : "auto",
        },
        variant === "primary" && !isDisabled && shadows.primaryBtn,
        style,
      ]}
    >
      {loading ? (
        <Ionicons name="ellipsis-horizontal" size={18} color={fg} />
      ) : icon ? (
        <Ionicons name={icon} size={spec.height * 0.42} color={fg} />
      ) : null}
      <Text style={[typography[spec.variant] as TextStyle, { color: fg }]}>{label}</Text>
      {iconRight ? <Ionicons name={iconRight} size={spec.height * 0.42} color={fg} /> : null}
    </Pressable>
  );
}

export interface IconButtonProps extends Omit<PressableProps, "style" | "children"> {
  name: IoniconName;
  color?: string;
  size?: number;
  /** Renders the notification pip when true. */
  dot?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  color,
  size = 22,
  dot,
  label,
  style,
  ...rest
}: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      {...rest}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? colors.foreground} />
      {dot ? <View style={[styles.pip, { backgroundColor: colors.red }]} /> : null}
    </Pressable>
  );
}

/* ── Stat card ──────────────────────────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  caption,
  tone,
  icon,
  style,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: string;
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg },
        style,
      ]}
    >
      <Row gap={6}>
        {icon ? <Ionicons name={icon} size={14} color={tone ?? colors.mutedForeground} /> : null}
        <Txt variant="caption" tone="muted" style={styles.flex}>
          {label.toUpperCase()}
        </Txt>
      </Row>
      <Txt variant="title" style={{ color: tone ?? colors.foreground }}>
        {value}
      </Txt>
      {caption ? (
        <Txt variant="caption" tone="muted" numberOfLines={1}>
          {caption}
        </Txt>
      ) : null}
    </View>
  );
}

/* ── Progress bar ───────────────────────────────────────────────────────────── */

export function ProgressBar({
  value,
  tone,
  track,
  height = 8,
  style,
}: {
  /** 0–1. `null` renders the empty track (the "no data yet" case). */
  value: number | null;
  tone?: string;
  track?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius } = useTheme();
  const clamped = value === null ? 0 : Math.max(0, Math.min(1, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={value === null ? undefined : { now: Math.round(clamped * 100), min: 0, max: 100 }}
      style={[
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: track ?? colors.muted,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: "100%",
          borderRadius: radius.pill,
          backgroundColor: tone ?? colors.primary,
        }}
      />
    </View>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

interface ButtonColors {
  bg: string;
  fg: string;
  border: number;
  borderColor: string;
}

function dimensions(variant: ButtonVariant, colors: ReturnType<typeof useTheme>["colors"]): ButtonColors {
  switch (variant) {
    case "primary":
      return { bg: colors.primary, fg: colors.primaryForeground, border: 0, borderColor: "transparent" };
    case "secondary":
      return { bg: colors.primaryTint, fg: colors.primaryDark, border: 0, borderColor: "transparent" };
    case "outline":
      return { bg: "transparent", fg: colors.foreground, border: 1, borderColor: colors.border };
    case "danger":
      return { bg: colors.redTint, fg: colors.red, border: 0, borderColor: "transparent" };
    case "ghost":
    default:
      return { bg: "transparent", fg: colors.mutedForeground, border: 0, borderColor: "transparent" };
  }
}

function fgFor(variant: ButtonVariant, colors: ReturnType<typeof useTheme>["colors"]): string {
  return dimensions(variant, colors).fg;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  iconButton: { padding: 6, alignItems: "center", justifyContent: "center" },
  pip: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  stat: {
    flex: 1,
    minWidth: 140,
    gap: 4,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
