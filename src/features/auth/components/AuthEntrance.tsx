import React, { useMemo, type PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';

/** One short reveal for an auth content group; controls never wait on a long stagger. */
export function AuthEntrance({
  children,
  style,
  delay = 0,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; delay?: number }>) {
  const reducedMotion = useReducedMotion();
  const entering = useMemo(
    () =>
      reducedMotion
        ? FadeIn.duration(150)
        : FadeInDown.withInitialValues({
            opacity: 0,
            transform: [{ translateY: 8 }],
          })
            .duration(240)
            .delay(delay)
            .easing(Easing.bezier(0.23, 1, 0.32, 1))
            .reduceMotion(ReduceMotion.System),
    [reducedMotion, delay],
  );
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
