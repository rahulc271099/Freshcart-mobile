const path = require('path');

module.exports = {
  preset: '@react-native/jest-preset',
  // NOTE: this replaces (rather than merges with) the preset's own
  // setupFiles, so the preset's react-native environment setup is
  // re-included explicitly alongside gesture-handler's mock.
  setupFiles: [
    require.resolve('@react-native/jest-preset/jest/setup.js'),
    'react-native-gesture-handler/jestSetup.js',
  ],
  // Same non-merging issue as setupFiles above: re-declaring
  // moduleNameMapper here would silently drop the preset's own
  // 'react-native' -> node_modules/react-native mapping, so it's
  // re-included explicitly alongside the '@/*' alias (kept in sync by
  // hand with tsconfig.json's `paths` and metro.config.js's
  // `resolver.alias` — none of the three read from each other).
  moduleNameMapper: {
    '^react-native($|/.*)': `${path.dirname(require.resolve('react-native'))}/$1`,
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // The default preset only transforms react-native itself. Every RN
  // library below ships an ES-module build under node_modules that needs
  // Babel too, or Jest fails with "Cannot use import statement outside a
  // module" the moment it's imported (even transitively, e.g. via
  // AppProvider -> react-native-gesture-handler).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native' +
      '|@react-native(-community)?' +
      '|@react-navigation' +
      '|react-native-gesture-handler' +
      '|react-native-reanimated' +
      '|react-native-worklets' +
      '|react-native-screens' +
      '|react-native-safe-area-context' +
      '|react-native-mmkv' +
      '|react-native-nitro-modules' +
      '|react-native-maps' +
      '|@shopify/flash-list' +
      '|@notifee/react-native' +
      '|@tanstack' +
      ')/)',
  ],
};
