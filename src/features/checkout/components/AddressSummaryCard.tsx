import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Briefcase, Clock, Home, MapPin } from 'lucide-react-native';

import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type {
  Address,
  AddressType,
} from '@/features/addresses/types/address.types';
import {
  addressTypeLabel,
  formatAddressLine,
} from '@/features/addresses/utils/formatAddress';

const LABEL_ICON: Record<AddressType, typeof Home> = {
  HOME: Home,
  WORK: Briefcase,
  OTHER: MapPin,
};

export interface AddressSummaryCardProps {
  address: Address;
  /** Static placeholder - see `ConfirmLocationScreen`'s own note on this
   * same value (no real delivery-estimate endpoint exists yet). */
  deliveryEtaMinutes: number;
  onChange: () => void;
}

/**
 * Read-only "shipping to" card shown on `PaymentScreen` - the chosen
 * address plus the delivery-time estimate, with a "Change" link back to
 * `ConfirmLocationScreen` rather than letting this screen pick a
 * different address itself (picking belongs to exactly one place).
 */
export function AddressSummaryCard({
  address,
  deliveryEtaMinutes,
  onChange,
}: AddressSummaryCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const LabelIcon = LABEL_ICON[address.address_type ?? 'OTHER'];
  const label = addressTypeLabel(address.address_type);
  const fullAddress = formatAddressLine(address);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.labelWrap}>
          <LabelIcon color={colors.primary} size={16} strokeWidth={2} />
          <Text style={styles.labelText}>{label} address</Text>
        </View>
        <Pressable onPress={onChange} hitSlop={8}>
          <Text style={styles.changeLink}>Change</Text>
        </Pressable>
      </View>

      <Text style={styles.contactText}>
        {address.contact_name} · {address.contact_mobile}
      </Text>
      <Text style={styles.addressText}>{fullAddress}</Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.labelWrap}>
          <Clock color={colors.textSecondary} size={14} strokeWidth={2} />
          <Text style={styles.deliveryLabel}>Delivery Time</Text>
        </View>
        <Text style={styles.deliveryValue}>{deliveryEtaMinutes} minutes</Text>
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    labelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    labelText: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    changeLink: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    contactText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    addressText: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: 2,
    },
    divider: {
      borderBottomWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.divider,
      marginVertical: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deliveryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    deliveryValue: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
  });
}
