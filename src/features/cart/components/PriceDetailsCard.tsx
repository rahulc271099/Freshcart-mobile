import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type { CartTotals } from '../hooks/useCartItems';

export interface PriceDetailsCardProps {
  totals: CartTotals;
}

/** Cart screen's itemized price breakdown - Total MRP, discount, delivery, To Pay. */
export function PriceDetailsCard({ totals }: PriceDetailsCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Price Details</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Total MRP</Text>
        <Text style={styles.value}>₹{totals.totalMrp}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, styles.discount]}>Discount on MRP</Text>
        <Text style={[styles.value, styles.discount]}>
          - ₹{totals.discount}
        </Text>
      </View>
      <View style={styles.row}>
        <View style={styles.deliveryLabelRow}>
          <Text style={styles.label}>Delivery Charges</Text>
          <icons.info color={colors.textSecondary} size={13} strokeWidth={2} />
        </View>
        <Text style={styles.value}>₹{totals.deliveryCharge}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.toPayLabel}>To Pay</Text>
        <Text style={styles.toPayValue}>₹{totals.toPay}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    title: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },
    label: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    value: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    discount: {
      color: colors.success,
    },
    deliveryLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: spacing.xs,
    },
    toPayLabel: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    toPayValue: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
  });
}
