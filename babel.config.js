module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Required by react-native-reanimated 4.x — Reanimated 4 delegates its
  // babel transform to the companion react-native-worklets package.
  // Must remain the last plugin in the list per react-native-reanimated docs.
  plugins: ['react-native-worklets/plugin'],
};
