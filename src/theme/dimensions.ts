import { Dimensions } from 'react-native';

/**
 * Common cross-screen layout dimensions. Screen width/height are read once
 * at module load — fine for layout math, but don't rely on this for
 * orientation-change-responsive layouts (use `useWindowDimensions()` for
 * that instead).
 */
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const dimensions = {
  screenWidth,
  screenHeight,
  headerHeight: 56,
  bottomTabHeight: 64,
  iconSize: {
    sm: 16,
    md: 24,
    lg: 32,
  },
} as const;
