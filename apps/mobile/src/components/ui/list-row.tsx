import { Children } from "react";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Ionicons } from "@/lib/icons";
import type { IoniconName } from "@/lib/icons";
import { useTheme } from "@/theme/provider";

import { Button, Row, Txt } from "./primitives";

/** Shorthand so row/group props stay readable. */
type StyleProp = ComponentProps<typeof View>["style"];

/* ── List row ───────────────────────────────────────────────────────────────── */

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Right-hand meta line, e.g. a time or a percentage. */
  meta?: string;
  /** Tinted icon chip on the leading edge (§11 "feed rows with tinted icon chips"). */
  icon?: IoniconName;
  iconFg?: string;
  iconBg?: string;
  /** Trailing status pill; mutually exclusive with `chevron`. */
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp;
}

/** The feed primitive: tinted chip + two lines + trailing meta. Used by every list. */
export function ListRow({
  title,
  subtitle,
  meta,
  icon,
  iconFg,
  iconBg,
  trailing,
  chevron,
  onPress,
  onLongPress,
  style,
}: ListRowProps) {
  const { colors, radius } = useTheme();
  const interactive = !!onPress || !!onLongPress;

  const body = (
    <Row gap={12} align="center" style={{ paddingVertical: 12 }}>
      {icon ? (
        <View
          style={[
            styles.chip,
            { backgroundColor: iconBg ?? colors.muted, borderRadius: radius.md },
          ]}
        >
          <Ionicons name={icon} size={18} color={iconFg ?? colors.mutedForeground} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="small" tone="muted" numberOfLines={2} style={{ marginTop: 1 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {meta ? (
        <Txt variant="smallStrong" tone="muted" style={styles.meta}>
          {meta}
        </Txt>
      ) : null}
      {trailing}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={colors.ink400} /> : null}
    </Row>
  );

  if (!interactive) return <View style={style}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && { opacity: 0.6 }, style]}
    >
      {body}
    </Pressable>
  );
}

/** Rows joined by hairlines, matching the web `data-table`'s grouped look. */
export function RowGroup({ children, style }: { children: ReactNode; style?: StyleProp }) {
  const { colors, radius } = useTheme();
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingHorizontal: 14,
        },
        style,
      ]}
    >
      {items.map((child, index) => (
        <View key={index}>
          {index > 0 ? (
            <View style={[styles.hairline, { backgroundColor: colors.border }]} />
          ) : null}
          {child}
        </View>
      ))}
    </View>
  );
}

/* ── States ─────────────────────────────────────────────────────────────────── */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Txt variant="small" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: IoniconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.center}>
      <View
        style={[
          styles.stateIcon,
          { backgroundColor: colors.primarySoft, borderRadius: radius.pill },
        ]}
      >
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Txt variant="heading" center>
        {title}
      </Txt>
      {message ? (
        <Txt variant="small" tone="muted" center style={{ maxWidth: 320 }}>
          {message}
        </Txt>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} icon="add" style={{ marginTop: 4 }} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.center}>
      <View
        style={[styles.stateIcon, { backgroundColor: colors.redTint, borderRadius: radius.pill }]}
      >
        <Ionicons name="cloud-offline-outline" size={26} color={colors.red} />
      </View>
      <Txt variant="heading" center>
        {title}
      </Txt>
      {message ? (
        <Txt variant="small" tone="muted" center style={{ maxWidth: 320 }}>
          {message}
        </Txt>
      ) : null}
      {onRetry ? <Button label="Try again" icon="refresh" onPress={onRetry} /> : null}
    </View>
  );
}

/**
 * One place that decides what a query result renders.
 *
 * Every screen would otherwise repeat the same loading/error/empty ladder with subtly
 * different copy, so screens hand their query state here and only describe the happy path.
 */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  empty,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Check your connection and try again."}
        onRetry={onRetry}
      />
    );
  }
  if (isEmpty) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  meta: { textAlign: "right" },
  chip: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  hairline: { height: StyleSheet.hairlineWidth, marginLeft: 50 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  stateIcon: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
});
