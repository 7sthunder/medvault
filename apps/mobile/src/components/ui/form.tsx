import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import type { StyleProp, TextInputProps, TextStyle } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { Ionicons } from "@/lib/icons";
import type { IoniconName } from "@/lib/icons";
import { useTheme } from "@/theme/provider";

import { Row, Txt } from "./primitives";

/* ── Field wrapper ──────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  style,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  style?: ComponentProps<typeof View>["style"];
}) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Row gap={4}>
        <Txt variant="smallStrong" tone="muted">
          {label}
        </Txt>
        {required ? (
          <Txt variant="smallStrong" tone="danger">
            *
          </Txt>
        ) : null}
      </Row>
      {children}
      {error ? (
        <Txt variant="caption" tone="danger">
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" tone="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/* ── Input ──────────────────────────────────────────────────────────────────── */

export interface InputProps extends Omit<TextInputProps, "style"> {
  invalid?: boolean;
  icon?: IoniconName;
  /** Renders a show/hide toggle and starts obscured. */
  secure?: boolean;
  wrapperStyle?: ComponentProps<typeof View>["style"];
}

export function Input({
  invalid,
  icon,
  secure,
  wrapperStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View
      style={[
        styles.inputWrap,
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderColor: invalid ? colors.red : focused ? colors.primary : colors.input,
          borderWidth: focused || invalid ? 1.5 : 1,
        },
        wrapperStyle,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.mutedForeground} />
      ) : null}
      <TextInput
        {...rest}
        secureTextEntry={hidden}
        placeholderTextColor={colors.ink400}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { color: colors.foreground },
          Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null,
        ]}
      />
      {secure ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Show password" : "Hide password"}
          hitSlop={8}
          onPress={() => setHidden((v) => !v)}
        >
          <Ionicons
            name={hidden ? "eye-outline" : "eye-off-outline"}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export function TextArea({
  invalid,
  rows = 4,
  style,
  ...rest
}: Omit<TextInputProps, "style"> & {
  invalid?: boolean;
  rows?: number;
  style?: StyleProp<TextStyle>;
}) {
  const { colors, radius, typography } = useTheme();
  return (
    <TextInput
      {...rest}
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      placeholderTextColor={colors.ink400}
      style={[
        styles.input,
        { height: rows * 24 + 24 },
        {
          color: colors.foreground,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: invalid ? 1.5 : 1,
          borderColor: invalid ? colors.red : colors.input,
          ...typography.body,
        },
        style,
      ]}
    />
  );
}

/* ── Switch row ─────────────────────────────────────────────────────────────── */

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
  icon,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  icon?: IoniconName;
}) {
  const { colors } = useTheme();
  return (
    <Row gap={12} align="flex-start" style={{ paddingVertical: 8, opacity: disabled ? 0.5 : 1 }}>
      {icon ? (
        <Ionicons name={icon} size={19} color={colors.mutedForeground} style={{ marginTop: 2 }} />
      ) : null}
      <View style={styles.flex}>
        <Txt variant="bodyStrong">{label}</Txt>
        {description ? (
          <Txt variant="small" tone="muted" style={{ marginTop: 2 }}>
            {description}
          </Txt>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ false: colors.input, true: colors.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.input}
      />
    </Row>
  );
}

/* ── Segmented control ──────────────────────────────────────────────────────── */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  style?: ComponentProps<typeof View>["style"];
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[styles.segmented, { backgroundColor: colors.muted, borderRadius: radius.lg }, style]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              {
                backgroundColor: active ? colors.card : "transparent",
                borderRadius: radius.md,
                shadowOpacity: active ? 0.08 : 0,
                shadowColor: "#000",
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: active ? 1 : 0,
              },
            ]}
          >
            <Txt variant="smallStrong" tone={active ? "default" : "muted"} center numberOfLines={1}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Select (bottom-sheet picker) ───────────────────────────────────────────── */

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  caption?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  error,
  required,
  hint,
}: {
  label: string;
  value: T | null;
  options: readonly SelectOption<T>[];
  onChange: (next: T) => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  hint?: string;
}) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Field label={label} error={error} required={required} hint={hint}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderColor: error ? colors.red : colors.input,
            borderWidth: error ? 1.5 : 1,
            minHeight: 46,
          },
        ]}
      >
        <Txt
          variant="body"
          tone={selected ? "default" : "subtle"}
          style={styles.flex}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Txt>
        <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close"
        />
        <View
          style={[styles.sheet, { backgroundColor: colors.popover, borderColor: colors.border }]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <Txt variant="heading" style={{ marginBottom: 4 }}>
            {label}
          </Txt>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: pressed ? colors.muted : "transparent" },
                  ]}
                >
                  <View style={styles.flex}>
                    <Txt variant="bodyStrong" tone={active ? "primary" : "default"}>
                      {option.label}
                    </Txt>
                    {option.caption ? (
                      <Txt variant="caption" tone="muted" style={{ marginTop: 2 }}>
                        {option.caption}
                      </Txt>
                    ) : null}
                  </View>
                  {active ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </Field>
  );
}

/* ── Date / time ────────────────────────────────────────────────────────────── */

/**
 * Native date+time pickers.
 *
 * `@react-native-community/datetimepicker` is in the Expo Go module set, so this shows
 * the real OS wheel/dialog instead of a hand-rolled one — which is both less code and
 * what a phone user expects. Android's picker closes after one pick, so time is a
 * separate step from date (matches plan §"TimePicker/DatePicker use native inputs").
 */
export function DateTimeField({
  label,
  value,
  onChange,
  mode,
  maximumDate,
  minimumDate,
  error,
  hint,
  required,
}: {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  mode: "date" | "time";
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string | null;
  hint?: string;
  required?: boolean;
}) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const display =
    mode === "time"
      ? value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : value.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderColor: error ? colors.red : colors.input,
            borderWidth: error ? 1.5 : 1,
            minHeight: 46,
          },
        ]}
      >
        <Ionicons
          name={mode === "time" ? "time-outline" : "calendar-outline"}
          size={18}
          color={colors.mutedForeground}
        />
        <Txt variant="body" style={styles.flex}>
          {display}
        </Txt>
        <Ionicons name="chevron-expand" size={16} color={colors.ink400} />
      </Pressable>

      {open ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(event: DateTimePickerEvent, next?: Date) => {
            // Android fires `dismissed` on cancel; keep the old value then.
            if (Platform.OS === "android") setOpen(false);
            if (event.type === "set" && next) onChange(next);
          }}
        />
      ) : null}
    </Field>
  );
}

/* ── Stepper (numeric setting, e.g. snooze minutes) ─────────────────────────── */

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <Row gap={12} style={{ paddingVertical: 6 }}>
      <Txt variant="body" style={styles.flex}>
        {label}
      </Txt>
      <Row gap={8}>
        <StepperButton
          icon="remove"
          label={`Decrease ${label}`}
          disabled={value <= min}
          onPress={() => onChange(clamp(value - step))}
        />
        <View style={{ minWidth: 64, alignItems: "center" }}>
          <Txt variant="bodyStrong">{`${value}${suffix ? ` ${suffix}` : ""}`}</Txt>
        </View>
        <StepperButton
          icon="add"
          label={`Increase ${label}`}
          disabled={value >= max}
          onPress={() => onChange(clamp(value + step))}
        />
      </Row>
    </Row>
  );
}

function StepperButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepperBtn,
        {
          backgroundColor: pressed ? colors.primaryTint : colors.muted,
          borderRadius: radius.md,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, padding: 0, margin: 0 },
  segmented: { flexDirection: "row", padding: 3, gap: 3 },
  segment: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, alignItems: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  stepperBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
