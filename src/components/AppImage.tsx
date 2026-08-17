import React from 'react';
import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';

/**
 * Image handling foundation.
 *
 * `expo-image` was evaluated (per the project's approved "expo-image /
 * maintained compatible alternative" option) but rejected for now: wiring
 * Expo modules into this bare React Native CLI project pulls in Expo's own
 * bundler/entry-point (`@expo/cli`, `export:embed`, `ExpoAppDelegate`) —
 * a much bigger architectural change than "add an image library", and the
 * official install tooling doesn't yet support this project's RN 0.86.2 /
 * React 19.2.3 combination anyway. See the Step 4 configuration notes.
 *
 * `AppImage` is a thin wrapper around React Native's built-in `Image` so
 * every screen goes through one place — if a dedicated caching/placeholder
 * library becomes justified later (once expo-image's tooling catches up,
 * or another library is chosen), only this file needs to change, not every
 * call site.
 *
 * Per the project's image-performance rule, the *source* should already be
 * served at an appropriate resolution (server-side/CDN resizing) — this
 * component does not do any resizing itself.
 */
export type AppImageProps = ImageProps & {
  style?: StyleProp<ImageStyle>;
};

export function AppImage({ resizeMode = 'cover', ...props }: AppImageProps) {
  return <Image resizeMode={resizeMode} {...props} />;
}
