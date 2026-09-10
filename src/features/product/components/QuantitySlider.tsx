import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface QuantitySliderProps {
  min: number;
  max: number;
  /** Values snapped to on release. */
  step: number;
  /** Uncontrolled initial position - this component owns the drag
   * gesture's continuous motion internally (a shared value driven at 60fps
   * by the gesture handler can't practically be "controlled" from React
   * state without fighting it), and only calls back out once per
   * settle. */
  initialValue: number;
  /** Values to render as labeled tick marks under the track. */
  marks: number[];
  formatValue: (value: number) => string;
  onChangeEnd: (value: number) => void;
}

/** Visual thumb diameter. */
const THUMB_SIZE = 24;
/** Actual draggable touch strip height - taller than the visible track/
 * thumb so the whole thing is easy to grab, not just the small dot. */
const TOUCH_HEIGHT = 44;

function clamp(value: number, lo: number, hi: number) {
  'worklet';
  return Math.min(Math.max(value, lo), hi);
}

/**
 * Generic draggable single-thumb slider - built for the "Custom Quantity"
 * control on Product Details' add-to-cart sheet (no slider existed
 * anywhere in the app before this). The whole track (not just the small
 * thumb) is the drag surface via `GestureDetector`, using each touch's
 * position (`event.x`) directly as the new thumb position - so both an
 * initial tap and a subsequent drag move it, which is what makes this
 * feel actually draggable rather than needing a precise grab on a tiny
 * dot. `activeOffsetX`/`failOffsetY` tell the gesture system to claim
 * horizontal motion and yield vertical motion to the sheet's own
 * scroll view, so the two don't fight over the same touch.
 */
export function QuantitySlider({
  min,
  max,
  step,
  initialValue,
  marks,
  formatValue,
  onChangeEnd,
}: QuantitySliderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [trackWidth, setTrackWidth] = useState(0);
  const [displayValue, setDisplayValue] = useState(initialValue);

  const valueToX = useCallback(
    (value: number, width: number) => ((value - min) / (max - min)) * width,
    [min, max],
  );

  const translateX = useSharedValue(0);

  const handleTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      setTrackWidth(width);
      translateX.value = valueToX(initialValue, width);
    },
    [initialValue, valueToX, translateX],
  );

  const updateDisplayValue = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const raw = min + (x / trackWidth) * (max - min);
      setDisplayValue(Math.round(raw));
    },
    [trackWidth, min, max],
  );

  const settle = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const raw = min + (x / trackWidth) * (max - min);
      const snapped = Math.min(
        Math.max(Math.round(raw / step) * step, min),
        max,
      );
      const settledX = valueToX(snapped, trackWidth);
      translateX.value = withTiming(settledX, { duration: 150 });
      setDisplayValue(snapped);
      onChangeEnd(snapped);
    },
    [trackWidth, min, max, step, valueToX, onChangeEnd, translateX],
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-10, 10])
    .onStart(event => {
      const next = clamp(event.x, 0, trackWidth);
      translateX.value = next;
      runOnJS(updateDisplayValue)(next);
    })
    .onUpdate(event => {
      const next = clamp(event.x, 0, trackWidth);
      translateX.value = next;
      runOnJS(updateDisplayValue)(next);
    })
    .onEnd(() => {
      runOnJS(settle)(translateX.value);
    });

  // A `Pan` gesture only activates once the touch has actually moved past
  // `activeOffsetX` - a plain tap-and-release (no movement) never fires
  // it at all, so the thumb didn't respond to a tap. `Tap` covers exactly
  // that case: jump straight to wherever was tapped. `Race` runs both and
  // lets whichever actually recognizes first win - a stationary touch
  // resolves as the tap, any real movement resolves as the pan - so they
  // never fight each other.
  const tap = Gesture.Tap().onEnd(event => {
    const next = clamp(event.x, 0, trackWidth);
    translateX.value = next;
    runOnJS(settle)(next);
  });

  const composedGesture = Gesture.Race(pan, tap);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }],
  }));
  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  return (
    <View>
      <Text style={styles.valueLabel}>{formatValue(displayValue)}</Text>

      <GestureDetector gesture={composedGesture}>
        <View
          style={styles.trackWrap}
          onLayout={handleTrackLayout}
          hitSlop={{ top: 12, bottom: 12 }}
        >
          <View style={styles.track} />
          <Animated.View style={[styles.trackFill, fillAnimatedStyle]} />
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
        </View>
      </GestureDetector>

      <View style={styles.marksRow}>
        {marks.map(mark => (
          <Text key={mark} style={styles.markLabel}>
            {formatValue(mark)}
          </Text>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    valueLabel: {
      alignSelf: 'center',
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    trackWrap: {
      height: TOUCH_HEIGHT,
      justifyContent: 'center',
    },
    track: {
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.border,
    },
    trackFill: {
      position: 'absolute',
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    thumb: {
      position: 'absolute',
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      borderWidth: 3,
      borderColor: colors.primary,
    },
    marksRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    markLabel: {
      fontSize: 10,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}
