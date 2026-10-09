import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { AppImage } from '@/components';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import type { CartLine } from '@/features/cart/types/cart.types';

export interface OrderItemsSummaryProps {
  lines: CartLine[];
  itemCount: number;
}

/**
 * Collapsed-by-default "N items ⌄" row (matches the reference Payment UI)
 * that expands into a compact read-only list of what's actually in the
 * cart - no quantity controls here, this screen is a review step, not
 * cart editing (that stays on `CartScreen`/`CartItemRow`).
 */
export function OrderItemsSummary({
  lines,
  itemCount,
}: OrderItemsSummaryProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.toggleRow}
        onPress={() => setExpanded(e => !e)}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} order items`}
      >
        <Text style={styles.toggleText}>
          {itemCount} item{itemCount === 1 ? '' : 's'}
        </Text>
        {expanded ? (
          <ChevronUp color={colors.primary} size={18} strokeWidth={2.5} />
        ) : (
          <ChevronDown color={colors.primary} size={18} strokeWidth={2.5} />
        )}
      </Pressable>

      {expanded ? (
        <View style={styles.list}>
          {lines.map(line => (
            <View key={line.id} style={styles.itemRow}>
              <View style={styles.itemImageBox}>
                <AppImage
                  source={{ uri: line.imageUri }}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {line.name}
                </Text>
                <Text style={styles.itemUnit}>
                  {line.unit} × {line.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ₹{line.price * line.quantity}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    toggleText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    itemImageBox: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    itemImage: {
      width: '100%',
      height: '100%',
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    itemUnit: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    itemTotal: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
  });
}
