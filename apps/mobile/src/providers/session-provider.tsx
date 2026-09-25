import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import type { Theme as ThemePreference } from "@shared/enums";

import { authClient, clearStoredSession } from "@/lib/auth";
import { api } from "@/lib/trpc";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  timezone: string;
  onboardingCompleted: boolean;
  isDemo: boolean;
}

export interface SessionValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** A session exists but `onboarding_completed` is still false. */
  needsOnboarding: boolean;
  /** Stored appearance preference; `undefined` while unknown or signed out. */
  themePreference: ThemePreference | undefined;
  signOut: () => Promise<void>;
  refetch: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Session state for the app shell.
 *
 * Reads from Better Auth (`useSession`) rather than a tRPC call because the expo plugin
 * caches the session in SecureStore — that cache is what lets the app open straight onto
 * the dashboard instead of flashing a login screen on every cold start. The server still
 * re-verifies the session on every procedure, so this is purely a UI concern.
 *
 * Also lifts `settings.appearance.theme` so the root layout can hand the *stored*
 * preference to `ThemeProvider` instead of falling back to the OS setting.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const isSignedIn = !!session?.user;

  const appearance = api.settings.appearance.useQuery(undefined, { enabled: isSignedIn });
  const me = api.auth.me.useQuery(undefined, { enabled: isSignedIn });
  const utils = api.useUtils();

  const signOut = useCallback(async () => {
    await authClient.signOut();
    // The expo plugin's cookie write is best-effort; without this a failed sign-out
    // leaves the cookie on the device and the next person to open the app lands in the
    // previous account.
    await clearStoredSession();
    utils.invalidate();
  }, [utils]);

  const value = useMemo<SessionValue>(() => {
    const user = (session?.user ?? null) as SessionUser | null;
    return {
      user,
      isLoading: isPending && !user,
      isAuthenticated: !!user,
      needsOnboarding: !!user && user.onboardingCompleted !== true,
      themePreference: appearance.data?.theme,
      signOut,
      refetch: () => {
        void me.refetch();
        void appearance.refetch();
      },
    };
  }, [session, isPending, appearance.data?.theme, signOut, me, appearance]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

/** The signed-in user's timezone, defaulting to UTC before the session resolves. */
export function useTimezone(): string {
  return useSession().user?.timezone ?? "UTC";
}
