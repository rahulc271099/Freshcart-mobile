import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import { BottomSheet, Button } from '@/components';
import { icons } from '@/constants/icons';
import type { Product } from '@/features/home/components/ProductCard';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import type { ProductWeightOption } from '../data/productDetails';
import { QuantitySlider } from './QuantitySlider';

interface ProductOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  weightOptions: ProductWeightOption[];
  /** Null for piece/bunch-based products - see this file's own comment on
   * why the custom-quantity control forks on it. */
  baseGrams: number | null;
  /** A shopper tapped "Add" on one of the preset option rows. */
  onAddOption: (option: ProductWeightOption) => void;
  /** A shopper used the custom quantity control, then tapped the sheet's
   * own "Add to Cart" footer button, for this computed total price. */
  onAddCustom: (total: number) => void;
}

const SLIDER_MIN = 100;
const SLIDER_MAX = 2000;
const SLIDER_STEP = 50;
const SLIDER_MARKS = [100, 500, 900, 1300, 1700, 2000];

function formatGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
  }
  return `${grams} g`;
}

/**
 * Bottom sheet shown from Product Details' "Add" pill - lets a shopper
 * either quick-add one of the two preset weight options, or drag a custom
 * quantity (grams, or a plain count for non-weight products) and add that
 * instead. Built from the reusable `BottomSheet` (this is its first real
 * caller) rather than a one-off Modal - the weight-option rows and the
 * custom-quantity control are the only genuinely new pieces here.
 */
export function ProductOptionsSheet({
  visible,
  onClose,
  product,
  weightOptions,
  baseGrams,
  onAddOption,
  onAddCustom,
}: ProductOptionsSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const discountPercent = product.discountPercent ?? 0;

  const [customGrams, setCustomGrams] = useState(baseGrams ?? 0);
  const [customCount, setCustomCount] = useState(1);

  const customTotal =
    baseGrams != null && baseGrams > 0
      ? Math.round((product.price * customGrams) / baseGrams)
      : product.price * customCount;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={product.name}
      footer={
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerTotal}>₹{customTotal}</Text>
          </View>
          <Button
            title="Add to Cart"
            onPress={() => onAddCustom(customTotal)}
            style={styles.footerBtn}
          />
        </View>
      }
    >
      <Text style={styles.sectionLabel}>Select from options</Text>
      {weightOptions.map(option => (
        <View key={option.id} style={styles.optionRow}>
          <Image
            source={{ uri: product.imageUri }}
            style={styles.optionImage}
          />
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <View style={styles.optionPriceRow}>
              <Text style={styles.optionPrice}>₹{option.price}</Text>
              <Text style={styles.optionOriginalPrice}>
                ₹{option.originalPrice}
              </Text>
            </View>
            {option.originalPrice > option.price && (
              <Text style={styles.optionSavings}>
                You save ₹{option.originalPrice - option.price} (
                {discountPercent}%)
              </Text>
            )}
          </View>
          <Pressable
            style={styles.addOptionBtn}
            onPress={() => onAddOption(option)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${option.label} ${product.name}`}
          >
            <Text style={styles.addOptionBtnText}>Add</Text>
          </Pressable>
        </View>
      ))}

      <Text style={[styles.sectionLabel, styles.customLabel]}>
        Custom Quantity
      </Text>
      {baseGrams != null ? (
        <QuantitySlider
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          initialValue={Math.min(Math.max(baseGrams, SLIDER_MIN), SLIDER_MAX)}
          marks={SLIDER_MARKS}
          formatValue={formatGrams}
          onChangeEnd={setCustomGrams}
        />
      ) : (
        <View style={styles.countStepper}>
          <Pressable
            style={styles.countBtn}
            onPress={() => setCustomCount(c => Math.max(1, c - 1))}
            hitSlop={8}
            accessibilityLabel="Decrease quantity"
          >
            <Minus color={colors.primary} size={16} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.countValue}>
            {customCount} × {product.unit}
          </Text>
          <Pressable
            style={styles.countBtn}
            onPress={() => setCustomCount(c => Math.min(10, c + 1))}
            hitSlop={8}
            accessibilityLabel="Increase quantity"
          >
            <Plus color={colors.primary} size={16} strokeWidth={2.5} />
          </Pressable>
        </View>
      )}

      <View style={styles.savingsBanner}>
        <icons.shield color={colors.primary} size={16} strokeWidth={2} />
        <Text style={styles.savingsBannerText}>
          You will save {discountPercent}% on this product
        </Text>
      </View>
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionLabel: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    customLabel: {
      marginTop: spacing.lg,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    optionImage: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.background,
    },
    optionInfo: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    optionPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
      marginTop: 2,
    },
    optionPrice: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    optionOriginalPrice: {
      fontSize: 12,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    optionSavings: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginTop: 1,
    },
    addOptionBtn: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    addOptionBtnText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    countStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    countBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countValue: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      minWidth: 90,
      textAlign: 'center',
    },
    savingsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.lg,
    },
    savingsBannerText: {
      flex: 1,
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    footerLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    footerTotal: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    footerBtn: {
      flex: 1,
      maxWidth: 200,
    },
  });
}
