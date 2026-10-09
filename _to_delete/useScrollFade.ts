import {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Scroll-linked fade for the content that sits on top of the hero photo
 * (badges, brand lockup, back button row).
 *
 * As the form scrolls up the hero content fades out, drifts down slightly
 * (it moves slower than the card - a light parallax that reads as depth) and
 * eases back in as the form scrolls down again. Everything runs on the UI
 * thread, driven directly by the scroll offset, so it tracks the finger and
 * the keyboard-driven scroll with no lag. Reduced-motion users keep the fade
 * (it is not movement) but lose the drift.
 *
 * @param fadeDistance - scroll distance (px) over which the content is gone
 * @returns `onScroll` for the scroll view and `heroStyle` for the hero wrapper
 */
export function useScrollFade(fadeDistance = 150) {
  const scrollY = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, fadeDistance * 0.75],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: reducedMotion ? 0 : Math.max(scrollY.value, 0) * 0.35,
      },
      {
        scale: interpolate(
          scrollY.value,
          [0, fadeDistance],
          [1, 0.96],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return { onScroll, heroStyle };
}
