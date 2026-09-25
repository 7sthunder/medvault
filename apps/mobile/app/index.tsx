import { Redirect } from "expo-router";
import { View } from "react-native";

import { LoadingState } from "@/components/ui/list-row";
import { useSession } from "@/providers/session-provider";

/**
 * Entry gate.
 *
 * Three-way redirect, in priority order:
 *  - no session            → login (or register, which is what a first-run user wants)
 *  - session, no onboarding → the onboarding wizard
 *  - session + onboarding  → the tab shell
 *
 * `onboardingCompleted` is DB-owned and read off the session user, matching the web
 * post-auth flow (`features/auth/flow.ts`).
 */
export default function Index() {
  const { isLoading, isAuthenticated, needsOnboarding } = useSession();

  // Better Auth restores the SecureStore session before first paint, so this is a brief
  // flash — but skipping it would bounce an authenticated user to /login.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <LoadingState label="Opening your schedule…" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (needsOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
