import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components';
import { OfferRow } from '@/features/offers/components/OfferRow';
import type { CartOffer } from '@/features/offers/types/offer.types';
import { fonts, spacing, useTheme, type ThemeColors } from '@/theme';

export interface OffersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  offers: CartOffer[];
  eligibleSubtotal: number;
}

/**
 * Full offer-detail sheet opened from the top banner's "View Offers" -
 * lists every active CART-scope offer (not just the ones
 * `AvailableOffersCard` shows below the items, which leaves out whichever
 * offer is already promoted to the banner itself). Reuses `OfferRow`, the
 * same row `AvailableOffersCard` renders, so every offer still looks
 * identical wherever it shows up.
 */
export function OffersBottomSheet({
  visible,
  onClose,
  offers,
  eligibleSubtotal,
}: OffersBottomSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Offers for you">
      <View style={styles.list}>
        {offers.length === 0 ? (
          <Text style={styles.empty}>No offers available right now.</Text>
        ) : (
          offers.map(offer => (
            <OfferRow
              key={offer.offer_id}
              offer={offer}
              eligibleSubtotal={eligibleSubtotal}
            />
          ))
        )}
      </View>
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    empty: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
  });
}
