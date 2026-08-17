import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

/**
 * Centralized elevation/shadow tokens. iOS uses shadowColor/Offset/Opacity/
 * Radius; Android uses `elevation` instead — this hides that split behind
 * one cross-platform token per level so components don't each reimplement it.
 */
function shadow(elevation: number, iosOpacity: number, iosRadius: number): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation },
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: iosOpacity,
      shadowRadius: iosRadius,
    },
    default: {},
  }) as ViewStyle;
}

export const shadows = {
  sm: shadow(2, 0.08, 2),
  md: shadow(4, 0.12, 4),
  lg: shadow(8, 0.16, 8),
} as const;

export type ShadowToken = keyof typeof shadows;
