import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useColorScheme } from "react-native";

import type { Theme as ThemePreference } from "@shared/enums";

import { DARK, LIGHT, radius, shadows, spacing, typography } from "@/theme/tokens";
import type { Palette, ThemeName } from "@/theme/tokens";

export interface Theme {
  scheme: ThemeName;
  colors: Palette;
  radius: typeof radius;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

/**
 * Resolves the active palette.
 *
 * `preference` is the user's stored setting (`settings.updateAppearance` → `theme`), which
 * is a *server* value, so it is passed in rather than read here — the provider stays a
 * pure function of (preference, system scheme) and can render before settings have loaded.
 */
export function resolveTheme(
  preference: ThemePreference | undefined,
  system: "light" | "dark" | null | undefined,
): Theme {
  const scheme: ThemeName =
    preference === "light" || preference === "dark" ? preference : (system ?? "light");

  return {
    scheme,
    colors: scheme === "dark" ? DARK : LIGHT,
    radius,
    spacing,
    typography,
    shadows,
    isDark: scheme === "dark",
  };
}

export function ThemeProvider({
  preference,
  children,
}: {
  preference?: ThemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const theme = useMemo(
    () => resolveTheme(preference, system === "dark" ? "dark" : "light"),
    [preference, system],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside <ThemeProvider>");
  return theme;
}
