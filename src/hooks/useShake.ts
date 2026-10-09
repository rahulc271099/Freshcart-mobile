import { useCallback } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Decaying left/right offsets (px). Ends at 0 so the field always settles home. */
const SHAKE_STEPS = [-10, 10, -8, 8, -4, 4, 0] as const;
const SHAKE_STEP_MS = 45;

/**
 * Horizontal "no" shake for invalid input.
 *
 * Apply `style` to an `Animated.View` and call `shake()` when validation
 * fails. Honours the OS "reduce motion" setting by doing nothing - the error
 * colour and message still communicate the failure.
 *
 * @returns `style` - animated style for the wrapper; `shake` - stable trigger.
 */
export function useShake() {
  const offsetX = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  const shake = useCallback(() => {
    if (reducedMotion) return;
    offsetX.value = withSequence(
      ...SHAKE_STEPS.map(step =>
        withTiming(step, {
          duration: SHAKE_STEP_MS,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );
  }, [offsetX, reducedMotion]);

  return { style, shake };
}
