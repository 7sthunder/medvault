import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useReminderSync } from "@/hooks/use-reminder-sync";
import { SessionProvider, useSession } from "@/providers/session-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { ThemeProvider, useTheme } from "@/theme/provider";

/**
 * Root layout.
 *
 * Provider order matters: tRPC sits outermost because the session provider queries
 * appearance settings through it, and `ThemeProvider` sits *inside* the session provider
 * so it can read the user's stored theme preference — the palette has to be right on the
 * very first frame, login screen included.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TRPCProvider>
        <SessionProvider>
          <ThemedShell />
        </SessionProvider>
      </TRPCProvider>
    </SafeAreaProvider>
  );
}

function ThemedShell() {
  const { themePreference } = useSession();
  return (
    <ThemeProvider preference={themePreference}>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const { colors, isDark } = useTheme();

  // Keeps on-device dose reminders in step with the schedule (see `lib/notifications`).
  useReminderSync();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="dose/[id]" />
        <Stack.Screen name="medication/[id]" />
        <Stack.Screen name="medication/new" />
        <Stack.Screen name="medication/edit/[id]" />
        <Stack.Screen name="adherence/medications" />
        <Stack.Screen name="caregiver/accept" />
        <Stack.Screen name="caregiver/alert/[id]" />
        <Stack.Screen name="settings/reminders" />
        <Stack.Screen name="settings/caregiver" />
        <Stack.Screen name="settings/appearance" />
        <Stack.Screen name="settings/data" />
        <Stack.Screen name="help" />
      </Stack>
    </View>
  );
}
