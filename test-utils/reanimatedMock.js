/**
 * Minimal stand-in for `react-native-reanimated` in component tests.
 *
 * The real package needs the native worklets runtime, which doesn't exist
 * under Jest. Screens only need the API surface below to render and be
 * driven through their props, so this keeps animation out of the picture.
 */
const React = require('react');
const { View, Image } = require('react-native');

/** Entering/exiting presets are chainable builders; every call returns itself. */
const chainable = () => {
  const builder = new Proxy(function () {}, {
    get: (_target, key) => (key === 'build' ? () => ({}) : () => builder),
  });
  return builder;
};

const AnimatedView = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref }),
);
const AnimatedImage = React.forwardRef((props, ref) =>
  React.createElement(Image, { ...props, ref }),
);

const identity = value => value;

module.exports = {
  __esModule: true,
  default: {
    View: AnimatedView,
    Image: AnimatedImage,
    ScrollView: AnimatedView,
  },
  Extrapolation: { CLAMP: 'clamp' },
  interpolate: (_v, _i, output) => output[0],
  useAnimatedScrollHandler: () => undefined,
  Easing: {
    bezier: () => identity,
    out: () => identity,
    quad: identity,
  },
  FadeIn: chainable(),
  FadeInDown: chainable(),
  ReduceMotion: { System: 'system', Never: 'never', Always: 'always' },
  cubicBezier: () => identity,
  interpolateColor: (_value, _input, output) => output[0],
  useAnimatedStyle: factory => factory(),
  useReducedMotion: () => false,
  useSharedValue: initial => ({ value: initial }),
  withSequence: (...steps) => steps[steps.length - 1],
  withSpring: identity,
  withTiming: identity,
};
