import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Briefcase, Home, MapPin } from 'lucide-react-native';

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

interface AddressOptionCardProps {
  address: Address;
  selected: boolean;
  onSelect: () => void;
  /** Why this address can't be ordered to (see `getAddressBlocker`) -
   * when set the row is dimmed, unselectable, and offers `onEdit`. */
  blocker?: string | null;
  onEdit?: () => void;
}

/**
 * One selectable row in `ConfirmLocationScreen`'s address list - visually
 * close to `features/addresses/components/AddressCard.tsx` (same label
 * icon/badge language) but swaps that card's edit/delete actions for a
 * single radio-select affordance, since this screen's only job is
 * choosing which saved address an order ships to (editing/deleting still
 * only happens from `AddressesScreen`).
 */
export function AddressOptionCard({
  address,
  selected,
  onSelect,
  blocker,
  onEdit,
}: AddressOptionCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const LabelIcon = LABEL_ICON[address.address_type ?? 'OTHER'];
  const label = addressTypeLabel(address.address_type);
  const fullAddress = formatAddressLine(address);

  return (
    <Pressable
      style={[
        styles.card,
        selected && styles.cardSelected,
        blocker ? styles.cardBlocked : null,
      ]}
      onPress={blocker ? onEdit : onSelect}
      accessibilityRole={blocker ? 'button' : 'radio'}
      accessibilityState={{ selected, disabled: false }}
      accessibilityLabel={`${label} address`}
    >
      <View
        style={[styles.iconBadge, selected && styles.iconBadgeSelected]}
      >
        <LabelIcon
          color={selected ? colors.primary : colors.textSecondary}
          size={18}
          strokeWidth={2}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>{label}</Text>
          {address.is_default ? (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.contactText} numberOfLines={1}>
          {address.contact_name} · {address.contact_mobile}
        </Text>
        <Text style={styles.addressText} numberOfLines={2}>
          {fullAddress}
        </Text>
        {blocker ? (
          <Text style={styles.blockerText}>{blocker} · Tap to edit</Text>
        ) : null}
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    cardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.backgroundSec,
    },
    cardBlocked: {
      opacity: 0.85,
      borderColor: colors.error,
    },
    blockerText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.error,
      marginTop: 4,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBadgeSelected: {
      backgroundColor: colors.background,
    },
    info: {
      flex: 1,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    labelText: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    defaultBadge: {
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    defaultBadgeText: {
      fontSize: 9,
      fontFamily: fonts.bold,
      color: colors.primary,
      letterSpacing: 0.5,
    },
    contactText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      marginTop: 2,
    },
    addressText: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: 2,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
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
