import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { authPalette } from '../authPalette';

const DOT = 6;
const ACTIVE_WIDTH = 24;
const INACTIVE_COLOR = 'rgba(255,255,255,0.4)';

function Dot({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: reducedMotion ? 0 : 260,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    });
  }, [active, progress, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    width: DOT + (ACTIVE_WIDTH - DOT) * progress.value,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [INACTIVE_COLOR, authPalette.brightBlue],
    ),
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export interface PageDotsProps {
  count: number;
  index: number;
}

/**
 * Pager indicator - the active dot stretches into a pill. Renders nothing for
 * a single page: dots promise more pages, and a lone one would be a dead end.
 */
export function PageDots({ count, index }: PageDotsProps) {
  if (count <= 1) return null;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Page ${index + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} active={i === index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    height: DOT,
    borderRadius: DOT / 2,
  },
});
