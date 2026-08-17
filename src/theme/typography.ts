import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

/**
 * Centralized type scale. Uses the OS default system font on purpose (no
 * custom font family decided yet) — swap `fontFamily` here once one is
 * chosen, rather than in every component.
 */
const fontFamily = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

function textStyle(overrides: TextStyle): TextStyle {
  return { fontFamily, ...overrides };
}

export const typography = {
  heading1: textStyle({ fontSize: 28, fontWeight: '700', lineHeight: 34 }),
  heading2: textStyle({ fontSize: 22, fontWeight: '700', lineHeight: 28 }),
  heading3: textStyle({ fontSize: 18, fontWeight: '600', lineHeight: 24 }),
  body: textStyle({ fontSize: 15, fontWeight: '400', lineHeight: 22 }),
  bodyStrong: textStyle({ fontSize: 15, fontWeight: '600', lineHeight: 22 }),
  caption: textStyle({ fontSize: 12, fontWeight: '400', lineHeight: 16 }),
  button: textStyle({ fontSize: 15, fontWeight: '600', lineHeight: 20 }),
} as const;

export type TypographyToken = keyof typeof typography;
