import type { TextStyle } from 'react-native';
import { fonts } from './fonts';

/**
 * Centralized type scale using the custom Inter font family.
 * Each token's `fontFamily` selects the correct weight-specific Inter asset directly - `fontWeight` is deliberately not set here (or anywhere else in the app): mixing it with a custom, weight-specific font family is what silently broke custom fonts before (see fonts.ts / react-native.config.js).
 */
export const typography = {
  heading1: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
  } as TextStyle,
  heading2: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
  } as TextStyle,
  heading3: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
  } as TextStyle,
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  bodyStrong: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
  } as TextStyle,
} as const;

export type TypographyToken = keyof typeof typography;
