import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

export interface CheckoutFooterProps {
  total: number;
  onCheckout: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cart screen's fixed (non-scrolling) bottom bar - "Safe & Secure" trust
 * badge plus the "Proceed to Checkout" CTA. `style` is exposed so the
 * screen can add its safe-area bottom margin without this component
 * needing to know about insets itself.
 */
export function CheckoutFooter({
  total,
  onCheckout,
  style,
}: CheckoutFooterProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.footer, style]}>
      <View style={styles.secureRow}>
        <View style={styles.secureIcon}>
          <icons.shield color={colors.primary} size={18} strokeWidth={2} />
        </View>
        <View style={styles.secureTextWrap}>
          <Text style={styles.secureTitle}>Safe & Secure</Text>
          <Text style={styles.secureSubtitle}>100% secure payments</Text>
        </View>
      </View>
      <Pressable style={styles.checkoutBtn} onPress={onCheckout}>
        <View>
          <Text style={styles.checkoutLabel}>Proceed to Checkout</Text>
          <Text style={styles.checkoutAmount}>₹{total}</Text>
        </View>
        <icons.chevronRight
          color={colors.textInverse}
          size={20}
          strokeWidth={2.5}
        />
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    secureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    secureIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secureTextWrap: {
      maxWidth: 90,
    },
    secureTitle: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    secureSubtitle: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    checkoutBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    checkoutLabel: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textInverse,
    },
    checkoutAmount: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textInverse,
      marginTop: 1,
    },
  });
}
