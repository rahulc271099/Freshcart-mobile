import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

/** Cart screen's empty-cart illustration + copy. */
export function CartEmptyState() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <icons.cart color={colors.textSecondary} size={40} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Your cart is empty</Text>
      <Text style={styles.body}>
        Add fresh fruits & vegetables to get started.
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    body: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
}
