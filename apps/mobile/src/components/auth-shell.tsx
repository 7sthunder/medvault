import { Link, Stack } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BRAND } from "@shared/brand";

import { Row, Txt } from "@/components/ui/primitives";
import { Logo } from "@/components/logo";
import { useTheme } from "@/theme/provider";

/**
 * Shared chrome for login / register / onboarding.
 *
 * Mirrors the web `AuthShell` (§5.3 hero gradient + centred card), collapsed to one
 * column because a phone has no side-by-side option. The gradient is faked with a tinted
 * block rather than `expo-linear-gradient` to keep the module list inside Expo Go's
 * guaranteed set with no extra native dependency.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View style={{ gap: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
      <View style={{ alignItems: "center", gap: 10, paddingTop: spacing.lg }}>
        <Logo size={56} />
        <Txt variant="title" center>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="small" tone="muted" center style={{ maxWidth: 320 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>

      <View
        style={{
          gap: spacing.lg,
          backgroundColor: colors.card,
          borderRadius: radius["2xl"],
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.xl,
        }}
      >
        {children}
      </View>

      {footer}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.hero, { backgroundColor: colors.primarySoft }]} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}

/** "Already have an account? Sign in" style cross-link. */
export function AuthFooterLink({
  prompt,
  href,
  action,
}: {
  prompt: string;
  href: "/login" | "/register" | "/onboarding";
  action: string;
}) {
  return (
    <Row gap={6} justify="center">
      <Txt variant="small" tone="muted">
        {prompt}
      </Txt>
      <Link href={href} asChild>
        <Txt variant="smallStrong" tone="primary">
          {action}
        </Txt>
      </Link>
    </Row>
  );
}

export { BRAND };

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    opacity: 0.7,
  },
});
