import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

import type { CartOffer } from '../types/offer.types';

export interface OfferRowProps {
  offer: CartOffer;
  /** Cart subtotal shoppers are judged against for `min_order_amount`. */
  eligibleSubtotal: number;
}

/**
 * Pulls `offer_type`/`discount_type`/`discount_value` (all backend-final
 * values) into a short display tag - this is formatting, not pricing: no
 * discount amount is derived here, same as `OfferBadge` elsewhere in the
 * app only ever echoing a number the backend already computed.
 */
function formatOfferValue(offer: CartOffer): string | null {
  if (offer.discount_type === 'PERCENT' && offer.discount_value != null) {
    return `${offer.discount_value}% OFF`;
  }
  if (offer.discount_type === 'FLAT' && offer.discount_value != null) {
    return `₹${offer.discount_value} OFF`;
  }
  if (offer.offer_type === 'FREE_DELIVERY') {
    return 'FREE DELIVERY';
  }
  return null;
}

/**
 * One offer's row - title/description, an eligibility pill, and an "add
 * ₹X more" hint when not yet eligible. Shared by `AvailableOffersCard`
 * (the cart screen's below-the-list card) and `OffersBottomSheet` (the
 * full-detail sheet opened from the top banner's "View Offers") so both
 * render every offer identically.
 */
export function OfferRow({ offer, eligibleSubtotal }: OfferRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const eligible =
    offer.min_order_amount == null || eligibleSubtotal >= offer.min_order_amount;
  // Plain subtraction of two already-final numbers for a "add ₹X more"
  // hint - the same category of display arithmetic MaxxsaverBanner's own
  // `remaining` already does, not a new discount derivation.
  const remaining =
    offer.min_order_amount != null
      ? Math.max(offer.min_order_amount - eligibleSubtotal, 0)
      : 0;
  const valueText = formatOfferValue(offer);

  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.title} numberOfLines={1}>
          {offer.label ?? offer.title}
        </Text>
        {offer.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {offer.description}
          </Text>
        ) : null}
        {!eligible && offer.min_order_amount != null ? (
          <Text style={styles.hint}>Add ₹{remaining} more to use this offer</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {valueText ? (
          <Text style={styles.value} numberOfLines={1}>
            {valueText}
          </Text>
        ) : null}
        <View
          style={[styles.pill, eligible ? styles.pillEligible : styles.pillLocked]}
        >
          <Text
            style={[
              styles.pillText,
              eligible ? styles.pillTextEligible : styles.pillTextLocked,
            ]}
          >
            {eligible ? 'Eligible' : 'Locked'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
    rowContent: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    description: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    hint: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.warning,
      marginTop: 2,
    },
    right: {
      alignItems: 'flex-end',
      gap: 4,
    },
    value: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    pill: {
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    pillEligible: {
      backgroundColor: colors.success,
    },
    pillLocked: {
      backgroundColor: colors.border,
    },
    pillText: {
      fontSize: 10,
      fontFamily: fonts.bold,
    },
    pillTextEligible: {
      color: colors.textInverse,
    },
    pillTextLocked: {
      color: colors.textSecondary,
    },
  });
}
