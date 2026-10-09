import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { authPalette } from '../authPalette';

export interface GlassPillProps {
  /** `dark` = translucent navy for use over photos; `light` = near-opaque white. */
  tone?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
}

/**
 * Small rounded capsule for badges that sit on the produce photo. Uses a
 * translucent fill rather than a native blur so it renders identically (and
 * cheaply) on iOS and Android.
 */
export function GlassPill({
  tone = 'dark',
  style,
  children,
}: PropsWithChildren<GlassPillProps>) {
  return (
    <View
      style={[styles.base, tone === 'dark' ? styles.dark : styles.light, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 7,
  },
  dark: {
    backgroundColor: authPalette.glassDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authPalette.glassBorder,
  },
  light: {
    backgroundColor: authPalette.glassLight,
  },
});
