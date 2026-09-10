import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  getThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/services/storage/mmkv';
import { darkColors, lightColors } from './colors';

export type { ThemePreference };

/** Shape of a resolved color palette — reuse this to type `colors` params in themed components. */
export type ThemeColors = typeof lightColors;

interface ThemeContextValue {
  /** Resolved scheme actually in effect right now, after applying `preference`. */
  dark: boolean;
  colors: ThemeColors;
  /** The stored preference — 'system' means "follow the OS setting". */
  preference: ThemePreference;
  /** Sets and persists the preference. Pass 'system' to go back to following the OS. */
  setScheme: (preference: ThemePreference) => void;
}

const defaultThemeContext: ThemeContextValue = {
  dark: false,
  colors: lightColors,
  preference: 'system',
  setScheme: () => {},
};

export const ThemeContext =
  createContext<ThemeContextValue>(defaultThemeContext);

/**
 * App-wide light/dark theme context, layered on top of the static
 * `lightColors`/`darkColors` tokens in `theme/colors.ts` — this file
 * doesn't define a palette, it only decides which one is active.
 *
 * Defaults to following the OS appearance setting (`preference: 'system'`).
 * An explicit user choice is persisted via MMKV (see
 * `services/storage/mmkv.ts`, the same place the rest of the app's local
 * persistence goes through) so it survives an app restart — and, unlike a
 * plain `useColorScheme()` + `useEffect` mirror, is never silently
 * overwritten by a later OS appearance change; only switching back to
 * `'system'` re-syncs with the OS.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const osScheme = useColorScheme();
  const [preference, setPreference] =
    useState<ThemePreference>(getThemePreference);

  const setScheme = useCallback((next: ThemePreference) => {
    setPreference(next);
    saveThemePreference(next);
  }, []);

  const dark =
    preference === 'system' ? osScheme === 'dark' : preference === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      dark,
      colors: dark ? darkColors : lightColors,
      preference,
      setScheme,
    }),
    [dark, preference, setScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
