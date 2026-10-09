import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import { OfferRow } from '@/features/offers/components/OfferRow';
import { useCartOffers } from '@/features/offers/hooks/useCartOffers';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

export interface AvailableOffersCardProps {
  /** Cart subtotal shoppers are judged against for each offer's
   * `min_order_amount` - pass `totals.itemsTotal` from `useCartItems`. */
  eligibleSubtotal: number;
  /** The offer already promoted to the top banner (CartScreen's "Starting
   * Offer" progress banner) - left out here so it isn't shown twice. */
  excludeOfferId?: number | null;
}

/**
 * Cart screen section listing currently-active CART-scope offers (GET
 * /api/v1/offers/?scope=CART - see `useCartOffers`/`getCartOffersApi` for
 * why the scope filter has to happen client-side), MINUS whichever one
 * `CartScreen` has already promoted to its top banner (the highest-
 * priority non-FREE_DELIVERY offer - see that screen's `primaryOffer`).
 * Free delivery (and any other non-promoted offer) stays here, in its
 * original below-the-items position.
 */
export function AvailableOffersCard({
  eligibleSubtotal,
  excludeOfferId,
}: AvailableOffersCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: allOffers, isLoading, isError } = useCartOffers();

  const offers = useMemo(
    () => (allOffers ?? []).filter(offer => offer.offer_id !== excludeOfferId),
    [allOffers, excludeOfferId],
  );

  if (isLoading || isError || offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <icons.tag color={colors.primary} size={16} strokeWidth={2} />
        <Text style={styles.headerText}>Offers for you</Text>
      </View>

      <View style={styles.list}>
        {offers.map(offer => (
          <OfferRow
            key={offer.offer_id}
            offer={offer}
            eligibleSubtotal={eligibleSubtotal}
          />
        ))}
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
      padding: spacing.sm,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    list: {
      gap: spacing.sm,
    },
  });
}
