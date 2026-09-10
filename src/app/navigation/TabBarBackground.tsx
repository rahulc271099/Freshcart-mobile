import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { shadows, useTheme } from '@/theme';
import { BAR_HEIGHT, CORNER_RADIUS, NOTCH_RADIUS } from './tabBarMetrics';

/**
 * Draws the tab bar's actual shape: a rounded-rect card with a circular
 * notch cut into the top-center edge, for the floating Cart button
 * (`FloatingCartButton` in AppTabs.tsx) to nest into - matching the
 * reference "cradle" bottom-bar design. A notch like this isn't
 * expressible with plain View border/backgroundColor, so it's drawn as an
 * actual SVG path (`react-native-svg` is already a project dependency, via
 * `lucide-react-native`'s icons - no new library added).
 *
 * Used as `tabBarBackground` in `AppTabs`, with `tabBarStyle.backgroundColor`
 * set to `'transparent'` so this is the only thing painting the bar.
 */
export function TabBarBackground() {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const path = useMemo(
    () => (width > 0 ? buildNotchedBarPath(width, BAR_HEIGHT) : ''),
    [width],
  );

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {width > 0 && (
        <Svg width={width} height={BAR_HEIGHT} style={StyleSheet.absoluteFill}>
          <Path d={path} fill={colors.background} />
        </Svg>
      )}
    </View>
  );
}

/**
 * Path for a rounded-rect the size of the bar, with a circular notch
 * removed from the top edge, centered horizontally.
 */
function buildNotchedBarPath(width: number, height: number): string {
  const cx = width / 2;
  const r = CORNER_RADIUS;
  const n = NOTCH_RADIUS;

  return [
    `M0,${r}`,
    `Q0,0 ${r},0`,
    `L${cx - n},0`,
    // Arc "removes" a semicircle of material from the top edge - this is
    // the notch the Cart button sits in.
    `A${n},${n} 0 0 0 ${cx + n},0`,
    `L${width - r},0`,
    `Q${width},0 ${width},${r}`,
    `L${width},${height - r}`,
    `Q${width},${height} ${width - r},${height}`,
    `L${r},${height}`,
    `Q0,${height} 0,${height - r}`,
    'Z',
  ].join(' ');
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    // Shadow approximates the bar's rounded-rect silhouette - RN doesn't
    // follow an SVG child's exact path for shadows without extra tooling,
    // so this is a reasonable stand-in rather than a pixel-perfect
    // shadow around the notch curve.
    ...shadows.lg,
  },
});
