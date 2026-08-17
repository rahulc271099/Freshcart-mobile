/**
 * Centralized spacing scale (4pt base). Use these instead of raw numbers
 * so screen padding, gaps and margins stay consistent across the app —
 * see project rule: avoid ad-hoc values like `margin: 13`.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;
