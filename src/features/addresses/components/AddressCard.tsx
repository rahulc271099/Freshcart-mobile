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
import type { Address, AddressType } from '../types/address.types';
import { getAddressBlocker } from '../utils/addressReadiness';
import { addressTypeLabel, formatAddressLine } from '../utils/formatAddress';

const LABEL_ICON: Record<AddressType, typeof Home> = {
  HOME: Home,
  WORK: Briefcase,
  OTHER: MapPin,
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
  const LabelIcon = LABEL_ICON[address.address_type ?? 'OTHER'];
  const label = addressTypeLabel(address.address_type);
  const fullAddress = formatAddressLine(address);
  const blocker = getAddressBlocker(address);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.labelWrap}>
          <LabelIcon color={colors.primary} size={16} strokeWidth={2} />
          <Text style={styles.labelText}>{label}</Text>
        </View>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </View>

      <Text style={styles.contactText}>
        {address.contact_name} · {address.contact_mobile}
      </Text>
      <Text style={styles.addressText}>{fullAddress}</Text>
      {blocker ? <Text style={styles.blockerText}>{blocker}</Text> : null}
      {address.delivery_instructions ? (
        <Text style={styles.instructionsText} numberOfLines={2}>
          Note: {address.delivery_instructions}
        </Text>
      ) : null}

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
            accessibilityLabel={`Edit ${label} address`}
          >
            <Pencil color={colors.textSecondary} size={16} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={onDelete}
            hitSlop={8}
            accessibilityLabel={`Delete ${label} address`}
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
    blockerText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.error,
      marginTop: spacing.xs,
    },
    contactText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    addressText: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: 2,
    },
    instructionsText: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      fontStyle: 'italic',
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
