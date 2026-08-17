export { colors, lightColors, darkColors, type ColorToken } from './colors';
export { spacing, type SpacingToken } from './spacing';
export { radius, type RadiusToken } from './radius';
export { shadows, type ShadowToken } from './shadows';
export { typography, type TypographyToken } from './typography';
export { dimensions } from './dimensions';

import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { typography } from './typography';
import { dimensions } from './dimensions';

/**
 * Single composed theme object for convenience:
 *   import { theme } from '@/theme'; theme.colors.primary
 * Prefer the named exports (`colors`, `spacing`, ...) in most components —
 * this is mainly useful when passing "the whole theme" down, e.g. to a
 * future ThemeProvider/context.
 */
export const theme = { colors, spacing, radius, shadows, typography, dimensions } as const;

export type Theme = typeof theme;
