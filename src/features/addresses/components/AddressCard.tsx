import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Home, MapPin, Pencil, Trash2, Briefcase } from 'lucide-react-native';

import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type { Address, AddressLabel } from '../types/address.types';

const LABEL_ICON: Record<AddressLabel, typeof Home> = {
  Home: Home,
  Work: Briefcase,
  Other: MapPin,
};

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const LabelIcon = LABEL_ICON[address.label];

  const fullAddress = [
    address.address_line_1,
    address.address_line_2,
    `${address.city}, ${address.state} ${address.pincode}`.trim(),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.labelWrap}>
          <LabelIcon color={colors.primary} size={16} strokeWidth={2} />
          <Text style={styles.labelText}>{address.label}</Text>
        </View>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </View>

      <Text style={styles.addressText}>{fullAddress}</Text>

      <View style={styles.actionsRow}>
        {!address.is_default && (
          <Pressable onPress={onSetDefault} hitSlop={8}>
            <Text style={styles.actionLink}>Set as default</Text>
          </Pressable>
        )}
        <View style={styles.iconActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={onEdit}
            hitSlop={8}
            accessibilityLabel={`Edit ${address.label} address`}
          >
            <Pencil color={colors.textSecondary} size={16} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={onDelete}
            hitSlop={8}
            accessibilityLabel={`Delete ${address.label} address`}
          >
            <Trash2 color={colors.error} size={16} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
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
    defaultBadge: {
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    defaultBadgeText: {
      fontSize: 9,
      fontFamily: fonts.bold,
      color: colors.primary,
      letterSpacing: 0.5,
    },
    addressText: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: spacing.xs,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    actionLink: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    iconActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginLeft: 'auto',
    },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
