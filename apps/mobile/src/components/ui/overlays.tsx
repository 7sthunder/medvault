import { useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { Ionicons } from "@/lib/icons";
import { useTheme } from "@/theme/provider";

import { Button, Row, Txt } from "./primitives";

/**
 * Bottom sheet.
 *
 * The web shell renders dialogs on desktop and switches to a drawer below `md`
 * (plan §"Modals"), which is why this is the *only* overlay primitive in the app: on a
 * phone every modal is a sheet. RN's `Modal` gives the hardware back button and the
 * iOS swipe-to-dismiss card for free, which is why there is no gesture handler here.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  /** Blocks outside-tap dismissal — used while a destructive action is in flight. */
  dismissible = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
}) {
  const { colors, shadows } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        accessibilityLabel="Close"
        onPress={() => dismissible && onClose()}
      />
      <View
        style={[
          styles.sheet,
          shadows.card,
          { backgroundColor: colors.popover, borderColor: colors.border },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        {title ? (
          <View style={{ paddingHorizontal: 20, marginBottom: subtitle ? 2 : 12 }}>
            <Txt variant="heading">{title}</Txt>
            {subtitle ? (
              <Txt variant="small" tone="muted" style={{ marginTop: 4 }}>
                {subtitle}
              </Txt>
            ) : null}
          </View>
        ) : null}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer ? (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>
        ) : null}
      </View>
    </Modal>
  );
}

/**
 * Confirmation dialog.
 *
 * Backed by a `Sheet` rather than `Alert.alert` because `Alert` cannot render the
 * skip-reason form, and because a consistent sheet keeps the delete flows looking the
 * same on both platforms.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading,
  onConfirm,
  onCancel,
  children,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onCancel}
      dismissible={!loading}
      title={title}
      subtitle={message}
      footer={
        <Row gap={10}>
          <Button label={cancelLabel} variant="outline" onPress={onCancel} style={{ flex: 1 }} disabled={loading} />
          <Button
            label={confirmLabel}
            variant={destructive ? "danger" : "primary"}
            onPress={onConfirm}
            loading={loading}
            style={{ flex: 1 }}
          />
        </Row>
      }
    >
      {children}
    </Sheet>
  );
}

/** Destructive action that needs a typed confirmation (delete account, wipe data). */
export function useConfirm(): {
  confirm: (options: {
    title: string;
    message?: string;
    confirmLabel?: string;
    destructive?: boolean;
    /** When set, the user must type this exact value to enable the confirm button. */
    requireText?: string;
    onConfirm: () => void | Promise<void>;
  }) => void;
  dialog: ReactNode;
} {
  const [state, setState] = useState<{
    title: string;
    message?: string;
    confirmLabel?: string;
    destructive?: boolean;
    requireText?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setState(null);
    setTyped("");
    setBusy(false);
  };

  return {
    confirm: (options) => {
      setTyped("");
      setState(options);
    },
    dialog: state ? (
      <ConfirmDialog
        visible
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        destructive={state.destructive}
        loading={busy}
        onCancel={close}
        onConfirm={async () => {
          setBusy(true);
          try {
            await state.onConfirm();
            close();
          } catch {
            // Leave the dialog open so the caller's error message has somewhere to land.
            setBusy(false);
          }
        }}
      >
        {state.requireText ? (
          <RequireTextInput value={typed} onChange={setTyped} target={state.requireText} />
        ) : null}
      </ConfirmDialog>
    ) : null,
  };
}

/** Friction for irreversible actions: the user must type the target word to proceed. */
function RequireTextInput({
  value,
  onChange,
  target,
}: {
  value: string;
  onChange: (next: string) => void;
  target: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ gap: 8, paddingBottom: 8 }}>
      <Txt variant="small" tone="muted">
        {`Type ${target} to confirm.`}
      </Txt>
      <View
        style={[
          styles.requireWrap,
          {
            borderColor: value === target ? colors.primary : colors.input,
            backgroundColor: colors.card,
            borderRadius: radius.lg,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={target}
          placeholderTextColor={colors.ink400}
          style={{ color: colors.foreground, fontSize: 15, padding: 0 }}
        />
      </View>
    </View>
  );
}

/** Success/failure toast. `sonner` is web-only, so this is a small local stand-in. */
export function Toast({
  message,
  tone = "default",
  onDismiss,
}: {
  message: string | null;
  tone?: "default" | "success" | "danger";
  onDismiss: () => void;
}) {
  const { colors, shadows, radius } = useTheme();
  if (!message) return null;

  const accent =
    tone === "success" ? colors.primary : tone === "danger" ? colors.red : colors.ink700;
  const icon = tone === "success" ? "checkmark-circle" : tone === "danger" ? "alert-circle" : "information-circle";

  return (
    <View style={styles.toastWrap} pointerEvents="box-none">
      <Pressable
        onPress={onDismiss}
        accessibilityRole="alert"
        style={[
          styles.toast,
          shadows.card,
          { backgroundColor: colors.popover, borderRadius: radius.lg, borderColor: colors.border },
        ]}
      >
        <Ionicons name={icon} size={18} color={accent} />
        <Txt variant="small" style={{ flex: 1 }}>
          {message}
        </Txt>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    maxHeight: "88%",
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  requireWrap: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  toastWrap: { position: "absolute", left: 16, right: 16, bottom: 24 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
