export { colors, lightColors, darkColors, type ColorToken } from './colors';
export { spacing, type SpacingToken } from './spacing';
export { radius, type RadiusToken } from './radius';
export { shadows, type ShadowToken } from './shadows';
export { typography, type TypographyToken } from './typography';
export { dimensions } from './dimensions';
export { fonts, type FontToken } from './fonts';
export {
  ThemeProvider,
  ThemeContext,
  useTheme,
  type ThemePreference,
  type ThemeColors,
} from './ThemeProvider';

import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { typography } from './typography';
import { dimensions } from './dimensions';
import { fonts } from './fonts';

/**
 * Single composed theme object for convenience:
 *   import { theme } from '@/theme'; theme.colors.primary
 * Prefer the named exports (`colors`, `spacing`, ...) in most components —
 * this is mainly useful when passing "the whole theme" down.
 *
 * NOTE: `theme.colors` here is always the static light palette — it does
 * NOT react to dark mode. Components that need to follow the active scheme
 * must use `useTheme().colors` from `ThemeProvider` instead. Existing
 * components built before `ThemeProvider` existed (Button, TextInput,
 * Header, Loader, ScreenContainer, OTPInput, and the screens using them)
 * still read the static `colors` export at module scope and will NOT
 * change with dark mode until they're migrated to `useTheme()`.
 */
export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  dimensions,
  fonts,
} as const;

export type Theme = typeof theme;
