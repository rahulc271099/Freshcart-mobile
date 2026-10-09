import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banknote } from 'lucide-react-native';

import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type { PaymentMethod } from '../types/checkout.types';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  subtitle: string;
}

// Only Cash on Delivery is actually wired up on the backend today (see
// `checkout.types.ts`'s own note on `PaymentMethod`) - a single-entry
// list rather than a guessed-at set of online payment options nothing
// here can actually process yet.
const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'COD',
    label: 'Cash on Delivery',
    subtitle: 'Pay with cash when your order arrives',
  },
];

export interface PaymentMethodCardProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodCard({
  selected,
  onSelect,
}: PaymentMethodCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Payment methods</Text>
      {PAYMENT_OPTIONS.map(option => {
        const isSelected = option.id === selected;
        return (
          <Pressable
            key={option.id}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => onSelect(option.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <View style={styles.iconBadge}>
              <Banknote color={colors.primary} size={18} strokeWidth={2} />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{option.label}</Text>
              <Text style={styles.subtitle}>{option.subtitle}</Text>
            </View>
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
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
      gap: spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
    rowSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.backgroundSec,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 11,
      height: 11,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
  });
}
