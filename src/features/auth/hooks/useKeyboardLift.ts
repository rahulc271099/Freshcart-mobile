import { useCallback, useEffect } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';
import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ANDROID_DURATION = 260;
const EASE = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Lifts the whole form (hero + card) above the keyboard with one animated
 * value, and fades the hero content out as it rises.
 *
 * Why a transform and not scrolling: scroll-based lifting needs extra bottom
 * padding that has to be removed again after the keyboard closes, and
 * removing it while the offset is non-zero makes the content snap (the
 * "jump" on the way back). A translateY changes no layout at all, so there
 * is nothing to snap - lift and return are the same tween in opposite
 * directions. On Android `adjustResize` is disabled by our translucent
 * status bar, so the window never resizes and this is the only mover.
 *
 * @param getCardTop - y of the card's top edge inside the screen content
 * @param topInset - space to leave above the lifted card (status bar + gap)
 * @returns `liftStyle` for the wrapper around hero + card and `heroStyle`
 *   for the hero content that fades away while lifted
 */
export function useKeyboardLift(getCardTop: () => number, topInset: number) {
  const progress = useSharedValue(0); // 0 = resting, 1 = fully lifted
  const distance = useSharedValue(0); // px the content travels when lifted
  const reducedMotion = useReducedMotion();

  const animateTo = useCallback(
    (value: 0 | 1, duration: number) => {
      progress.value = reducedMotion
        ? value
        : withTiming(value, { duration, easing: EASE });
    },
    [progress, reducedMotion],
  );

  useEffect(() => {
    const isIOS = Platform.OS === 'ios';

    const onShow = (event: KeyboardEvent) => {
      // Never lift further than the keyboard is tall, so the strip exposed
      // under the card is always hidden behind the keyboard.
      const wanted = Math.max(getCardTop() - topInset, 0);
      distance.value = Math.min(wanted, event.endCoordinates.height);
      animateTo(1, isIOS ? event.duration || 250 : ANDROID_DURATION);
    };
    const onHide = (event: KeyboardEvent) => {
      animateTo(0, isIOS ? event?.duration || 250 : ANDROID_DURATION);
    };

    const subs = [
      Keyboard.addListener(
        isIOS ? 'keyboardWillShow' : 'keyboardDidShow',
        onShow,
      ),
      Keyboard.addListener(
        isIOS ? 'keyboardWillHide' : 'keyboardDidHide',
        onHide,
      ),
    ];
    return () => subs.forEach(sub => sub.remove());
  }, [animateTo, distance, getCardTop, topInset]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * distance.value }],
  }));

  // Gone by the time the form is ~40% of the way up - it fades, not clips.
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.96]) }],
  }));

  return { liftStyle, heroStyle };
}
