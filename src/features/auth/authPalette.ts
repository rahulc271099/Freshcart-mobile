/**
 * Colours for content that sits ON the produce photograph. They are
 * deliberately NOT theme tokens: the photo is identical in light and dark
 * mode, so legibility on it can't depend on the active palette. Everything
 * on the white/dark card surfaces uses `useTheme()` instead.
 */
export const authPalette = {
  /** Backdrop behind the photo - avoids a white flash while it decodes. */
  night: '#0A1224',
  white: '#FFFFFF',
  /** Body copy over the darkest part of the scrim. */
  onPhotoMuted: 'rgba(255,255,255,0.84)',
  /** Tinted last word of the onboarding headline. */
  accentSoft: '#BFD7FF',
  /** Dark ink for the light veil at the top of the OTP photo. */
  ink: '#102A56',
  /** Bright CTA blue used on photo (matches the Stitch onboarding button). */
  brightBlue: '#2F73F2',
  glassDark: 'rgba(8,16,36,0.5)',
  glassLight: 'rgba(255,255,255,0.94)',
  glassBorder: 'rgba(255,255,255,0.22)',
  indigo: '#5B5FE0',
} as const;
