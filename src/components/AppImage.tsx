import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  type ImageProps,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ImageOff } from 'lucide-react-native';

import API_CONFIG from '@/config/api';
import { useTheme } from '@/theme';

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
 * What this wrapper adds over a bare `Image` (both JS-level only — no new
 * native dependency, consistent with the decision above):
 *  - A gentle opacity fade-in once the bitmap has actually decoded, so a
 *    slow/cold network load doesn't pop the image in abruptly.
 *  - An error fallback (icon + tinted box) instead of a blank gap when a
 *    URL still 404s or is unreachable after the rewrite below.
 *  - A host rewrite for a known backend bug: the catalogue API stores
 *    some `Products.ImageURL` values as an absolute `http://localhost:<port>/
 *    media/...` URL baked in at upload time on the machine running Django
 *    itself - `localhost` never resolves to anything on a real device or
 *    emulator. Since the broken part is only the scheme+host (the `/media/...`
 *    path itself is valid on the real backend), `resolveMediaUri` below
 *    swaps a `localhost` origin for the app's own configured API origin
 *    (`API_CONFIG.BASE_URL`, e.g. `https://freshcart-server-1.onrender.com`)
 *    client-side, with no backend change needed. Any other URL (already
 *    absolute to a real host, or a required local asset) passes through
 *    unchanged.
 *
 * Per the project's image-performance rule, the *source* should already be
 * served at an appropriate resolution (server-side/CDN resizing) — this
 * component does not do any resizing itself.
 */
export type AppImageProps = ImageProps & {
  style?: StyleProp<ImageStyle>;
};

/** A stable string to detect "this is genuinely a different image" across
 * renders, regardless of whether `source` is a `{uri}` object (a new
 * object identity every render) or a required local asset (a numeric
 * module id). */
function sourceKey(source: ImageProps['source']): string {
  if (typeof source === 'number') return String(source);
  if (Array.isArray(source)) return JSON.stringify(source);
  return source?.uri ?? '';
}

/** Rewrites a `http(s)://localhost[:port]/...` image URL (see this file's
 * top comment) to use the app's real, configured API origin instead -
 * everything after the host (the `/media/...` path, query string, etc.)
 * is kept as-is. Any URL that isn't a `localhost` origin is returned
 * unchanged. Uses a regex instead of the `URL` global since that global
 * isn't guaranteed to be polyfilled in this RN runtime. */
function resolveMediaUri(uri: string | undefined): string | undefined {
  if (!uri) return uri;
  const localhostMatch = /^https?:\/\/localhost(?::\d+)?/i.exec(uri);
  if (!localhostMatch) return uri;

  const apiOrigin = /^https?:\/\/[^/]+/i.exec(API_CONFIG.BASE_URL ?? '');
  if (!apiOrigin) return uri; // nothing sensible to rewrite to - leave as-is

  return apiOrigin[0] + uri.slice(localhostMatch[0].length);
}

export function AppImage({
  resizeMode = 'cover',
  style,
  source,
  onLoad,
  onError,
  ...props
}: AppImageProps) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  );
  const opacity = useSharedValue(0);

  // Only a `{uri}` object source can ever be one of the broken `localhost`
  // URLs this rewrite targets - a required local asset (a numeric module
  // id) or an asset array passes through `resolveMediaUri` untouched.
  const resolvedSource = useMemo(() => {
    if (
      source &&
      typeof source === 'object' &&
      !Array.isArray(source) &&
      'uri' in source
    ) {
      return { ...source, uri: resolveMediaUri(source.uri) };
    }
    return source;
  }, [source]);
  const key = sourceKey(resolvedSource);

  // A prop change to a genuinely different image (e.g. this `AppImage`
  // instance gets recycled by a list for a different row) needs to reset
  // back to the loading/fade-in state - otherwise a previously-loaded
  // image's opacity=1 would carry over and skip the fade for the new one.
  useEffect(() => {
    setStatus('loading');
    opacity.value = 0;
    // `opacity` is a stable reanimated shared value ref - only `key`
    // should actually retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (status === 'error') {
    return (
      <View
        style={[
          style,
          styles.fallback,
          { backgroundColor: colors.backgroundSec },
        ]}
      >
        <ImageOff color={colors.textSecondary} size={20} strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <View style={style}>
      <Animated.Image
        source={resolvedSource}
        resizeMode={resizeMode}
        style={[StyleSheet.absoluteFill, animatedStyle]}
        onLoad={event => {
          setStatus('loaded');
          opacity.value = withTiming(1, { duration: 220 });
          onLoad?.(event);
        }}
        onError={event => {
          setStatus('error');
          onError?.(event);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
