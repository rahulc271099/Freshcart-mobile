import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { images } from '@/constants/images';
import { radius, useTheme } from '@/theme';

/** Reuses the bundled produce cutout. Cropping is confined to decoration, never text. */
export function AuthProduce({
  size,
  compact = false,
}: {
  size: number;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const imageHeight = size * (1800 / 864);
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.frame,
        {
          width: size,
          height: compact ? size * 0.48 : size * 0.82,
          backgroundColor: colors.backgroundSec,
        },
      ]}
    >
      <Image
        source={images.loginBg}
        resizeMode="contain"
        style={[
          styles.image,
          {
            width: size,
            height: imageHeight,
            top: -imageHeight * (compact ? 0.48 : 0.34),
          },
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  image: { position: 'absolute' },
  frame: { overflow: 'hidden', borderRadius: radius.xlg },
});
