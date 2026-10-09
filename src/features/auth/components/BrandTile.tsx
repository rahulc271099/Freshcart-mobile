import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { images } from '@/constants/images';

export interface BrandTileProps {
  /** Edge length in dp. */
  size: number;
  style?: StyleProp<ViewStyle>;
}

/** F&V logo tile. Decorative - the wordmark text next to it carries the name. */
export function BrandTile({ size, style }: BrandTileProps) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.shadow,
        { width: size, height: size, borderRadius: size * 0.26 },
        style,
      ]}
    >
      <Image
        source={images.brandLogo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
