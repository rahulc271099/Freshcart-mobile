import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

export interface ApplyCouponRowProps {
  onPress?: () => void;
}

/**
 * Cart screen's "Apply Coupon" row. TODO: wire `onPress` to a real
 * coupon-entry flow once features/checkout (or a dedicated coupons feature)
 * exists - currently a no-op like the rest of the cart screen's
 * not-yet-built actions.
 */
export function ApplyCouponRow({ onPress }: ApplyCouponRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <icons.tag color={colors.textSecondary} size={18} strokeWidth={2} />
        <Text style={styles.text}>Apply Coupon</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.apply}>Apply</Text>
        <icons.chevronRight
          color={colors.primary}
          size={16}
          strokeWidth={2.5}
        />
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      ...shadows.sm,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    text: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    apply: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
  });
}
