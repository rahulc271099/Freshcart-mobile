// /**
//  * Centralized color tokens.
//  *
//  * PLACEHOLDER PALETTE — final branding hasn't been decided yet (see the
//  * Step 2 scaffold notes: app name/bundle id are placeholders too). The
//  * point of centralizing colors here is exactly so that decision can change
//  * later by editing this one file, instead of hunting through every screen.
//  *
//  * Shaped as light/dark from the start (per project rule: "prepared for
//  * future dark/light theme") and now actually wired up — see
//  * `theme/ThemeProvider.tsx` for the context that picks between these two
//  * based on the OS setting / the user's stored preference.
//  *
//  * IMPORTANT: `lightColors` and `darkColors` must stay structurally
//  * identical (same keys) — `ThemeProvider`'s `colors` value is typed as
//  * `typeof lightColors`, so a key present only in one palette is a real,
//  * silent runtime bug (reads as `undefined` in whichever mode is missing
//  * it), not just a lint nit.
//  */
// const base = {
//   success: '#2E7D32',
//   warning: '#ED6C02',
//   error: '#D32F2F',
//   info: '#0288D1',
// };

// export const lightColors = {
//   primary: '#2F9E44',
//   primaryDark: '#22803A',
//   secondary: '#F2A93B',

//   background: '#FFFFFF',
//   surface: '#F7F7F5',
//   backgroundSec: '#FCF8F5',

//   textPrimary: '#1A1A1A',
//   textSecondary: '#6B6B6B',
//   textInverse: '#FFFFFF',

//   border: '#E4E4E0',
//   divider: '#ECECEA',
//   overlay: 'rgba(0, 0, 0, 0.4)',

//   ...base,
// };

// export const darkColors = {
//   primary: '#3FBE58',
//   primaryDark: '#2F9E44',
//   secondary: '#F2A93B',

//   // background: '#121212',
//   // surface: '#1E1E1E',
//   background: '#16181A',
//   surface: '#16181A',
//   // Dark counterpart of `backgroundSec` — kept a touch warmer than
//   // `background` itself, same relative relationship as light mode's
//   // `#FCF8F5` vs `#FFFFFF`. Placeholder like the rest of this palette;
//   // revisit alongside the real branding.
//   backgroundSec: '#0D0E11',

//   textPrimary: '#F2F2F2',
//   textSecondary: '#B0B0B0',
//   textInverse: '#1A1A1A',

//   border: '#2C2C2C',
//   divider: '#262626',
//   overlay: 'rgba(0, 0, 0, 0.6)',

//   ...base,
// };

// export const colors = lightColors;

// export type ColorToken = keyof typeof lightColors;

/**
 * Centralized color tokens.
 *
 * BLUE / SOFT-BLUE PALETTE
 *
 * The palette is designed around the new UI direction:
 * - Strong blue for primary actions and active states
 * - Navy for primary text
 * - Soft blue for secondary backgrounds
 * - White for main surfaces and cards
 * - Blue-gray for secondary text
 * - Very light blue for borders and dividers
 *
 * The color tokens are centralized here so the visual identity can be
 * changed later without modifying individual screens/components.
 *
 * IMPORTANT:
 * `lightColors` and `darkColors` must stay structurally identical.
 * `ThemeProvider` uses the light palette as the type source, so a missing
 * key in either palette can result in undefined colors at runtime.
 */

const base = {
  success: '#2E8B57',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#2196F3',
};

export const lightColors = {
  // ─── Brand / Primary ──────────────────────────────────────────────────────

  /** Main brand blue - buttons, active tabs, cart, links */
  primary: '#1769E0',

  /** Darker blue for pressed/strong emphasis states */
  primaryDark: '#0D47A1',

  /** Lighter blue for secondary actions and accents */
  secondary: '#4DA3FF',

  // ─── Backgrounds / Surfaces ──────────────────────────────────────────────

  /** Main application background */
  background: '#FFFFFF',

  /** Cards, navigation bars and elevated surfaces */
  surface: '#FFFFFF',

  /** Soft blue-tinted background used for sections and highlighted areas */
  backgroundSec: '#F3F8FF',

  // ─── Text ────────────────────────────────────────────────────────────────

  /** Main headings and primary content */
  textPrimary: '#102A56',

  /** Supporting text, metadata and inactive navigation */
  textSecondary: '#526581',

  /** Text/icons displayed on primary-colored backgrounds */
  textInverse: '#FFFFFF',

  // ─── Borders / Dividers ──────────────────────────────────────────────────

  /** Light blue border for cards, inputs and controls */
  border: '#D9E8FA',

  /** Very subtle divider between sections */
  divider: '#EAF2FC',

  // ─── Overlay ─────────────────────────────────────────────────────────────

  overlay: 'rgba(16, 42, 86, 0.35)',

  // ─── Bottom Navigation ───────────────────────────────────────────────────

  /** Bottom navigation background */
  tabBar: '#FFFFFF',

  /** Active tab icon/text */
  tabBarActive: '#1769E0',

  /** Inactive tab icon/text */
  tabBarInactive: '#526581',

  // ─── Floating Cart ───────────────────────────────────────────────────────

  /** Main floating cart button */
  cartBackground: '#1769E0',

  /** Accent used for the decorative cart arc/highlight */
  cartAccent: '#BFDFFF',

  // ─── Semantic Colors ─────────────────────────────────────────────────────

  ...base,
};

export const darkColors = {
  // ─── Brand / Primary ──────────────────────────────────────────────────────

  /** Brighter blue for visibility against dark surfaces */
  primary: '#4D9CFF',

  /** Darker brand blue */
  primaryDark: '#1769E0',

  /** Secondary lighter blue */
  secondary: '#7DB8FF',

  // ─── Backgrounds / Surfaces ──────────────────────────────────────────────

  /** Main dark application background */
  background: '#0D1524',

  /** Cards, navigation bars and elevated surfaces */
  surface: '#111D30',

  /** Slightly lighter blue-tinted section background */
  backgroundSec: '#15253B',

  // ─── Text ────────────────────────────────────────────────────────────────

  /** Main headings and primary content */
  textPrimary: '#F4F8FF',

  /** Supporting text and metadata */
  textSecondary: '#A9BAD1',

  /** Text/icons displayed on primary-colored backgrounds */
  textInverse: '#FFFFFF',

  // ─── Borders / Dividers ──────────────────────────────────────────────────

  /** Subtle blue-gray border */
  border: '#263B56',

  /** Subtle divider */
  divider: '#1E3048',

  // ─── Overlay ─────────────────────────────────────────────────────────────

  overlay: 'rgba(0, 0, 0, 0.6)',

  // ─── Bottom Navigation ───────────────────────────────────────────────────

  /** Bottom navigation background */
  tabBar: '#111D30',

  /** Active tab icon/text */
  tabBarActive: '#4D9CFF',

  /** Inactive tab icon/text */
  tabBarInactive: '#8FA3BC',

  // ─── Floating Cart ───────────────────────────────────────────────────────

  /** Main floating cart button */
  cartBackground: '#1769E0',

  /** Decorative cart arc/highlight */
  cartAccent: '#4D9CFF',

  // ─── Semantic Colors ─────────────────────────────────────────────────────

  ...base,
};

/**
 * Default exported palette.
 *
 * Keep this as the light palette so existing imports such as:
 *
 *   import { colors } from '@/theme/colors';
 *
 * continue to work.
 *
 * Components that use `useTheme()` will receive the appropriate
 * light/dark palette from ThemeProvider.
 */
export const colors = lightColors;

/**
 * Union of all available color token names.
 */
export type ColorToken = keyof typeof lightColors;