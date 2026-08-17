/**
 * Centralized color tokens.
 *
 * PLACEHOLDER PALETTE — final branding hasn't been decided yet (see the
 * Step 2 scaffold notes: app name/bundle id are placeholders too). The
 * point of centralizing colors here is exactly so that decision can change
 * later by editing this one file, instead of hunting through every screen.
 *
 * Shaped as light/dark from the start (per project rule: "prepared for
 * future dark/light theme") even though only `light` is wired up yet —
 * `useColorScheme()` in App.tsx currently only drives the status bar, not
 * a real dark palette.
 */
const base = {
  success: '#2E7D32',
  warning: '#ED6C02',
  error: '#D32F2F',
  info: '#0288D1',
};

export const lightColors = {
  primary: '#2F9E44',
  primaryDark: '#22803A',
  secondary: '#F2A93B',

  background: '#FFFFFF',
  surface: '#F7F7F5',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textInverse: '#FFFFFF',

  border: '#E4E4E0',
  divider: '#ECECEA',
  overlay: 'rgba(0, 0, 0, 0.4)',

  ...base,
};

export const darkColors = {
  primary: '#3FBE58',
  primaryDark: '#2F9E44',
  secondary: '#F2A93B',

  background: '#121212',
  surface: '#1E1E1E',

  textPrimary: '#F2F2F2',
  textSecondary: '#B0B0B0',
  textInverse: '#1A1A1A',

  border: '#2C2C2C',
  divider: '#262626',
  overlay: 'rgba(0, 0, 0, 0.6)',

  ...base,
};

export const colors = lightColors;

export type ColorToken = keyof typeof lightColors;
