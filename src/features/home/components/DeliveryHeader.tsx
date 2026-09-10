import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, User } from 'lucide-react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface DeliveryHeaderProps {
  /** TODO: wire to the real saved/detected address once the address/
   * location feature exists; placeholder for now (same as before this was
   * split out of HomeScreen). */
  address?: string;
  /** Whether to show the small unread dot on the notification bell - only
   * ever shown when there's actually something unread, never as a default
   * "look, notifications!" nudge. */
  hasUnread?: boolean;
  onAddressPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
}

/**
 * Home screen's top bar: delivery address (left, truncates gracefully) and
 * two action icons (right) - Notifications (was Search) and Profile.
 * Extracted out of HomeScreen so the screen's own scroll-hide animation can
 * wrap just this component instead of re-implementing the row here.
 */
export function DeliveryHeader({
  address = '221B Baker Street, London',
  hasUnread = false,
  onAddressPress,
  onNotificationsPress,
  onProfilePress,
}: DeliveryHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.topBar}>
      <Pressable style={styles.addressRow} onPress={onAddressPress} hitSlop={8}>
        <icons.location color={colors.primary} size={18} strokeWidth={2} />
        <View style={styles.addressTextWrap}>
          <Text style={styles.addressLabel}>Deliver to</Text>
          <View style={styles.addressLine}>
            <Text style={styles.addressValue} numberOfLines={1}>
              {address}
            </Text>
            <icons.chevronDown
              color={colors.textSecondary}
              size={16}
              strokeWidth={2}
            />
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {/* TODO: navigate to a Notifications screen once one exists. */}
        <Pressable
          style={styles.iconBtn}
          onPress={onNotificationsPress}
          hitSlop={8}
          accessibilityLabel="Notifications"
        >
          <Bell color={colors.textPrimary} size={20} strokeWidth={2} />
          {hasUnread && <View style={styles.unreadDot} />}
        </Pressable>
        {/* TODO: navigate to a Profile screen once one exists. */}
        <Pressable
          style={styles.iconBtn}
          onPress={onProfilePress}
          hitSlop={8}
          accessibilityLabel="Profile"
        >
          <User color={colors.textPrimary} size={20} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      // Whole fixed header chrome (this + the search/category group below
      // it in HomeScreen) uses the secondary background, not the screen's
      // main `colors.background` - keeps it visually distinct from the
      // scrollable content underneath.
      backgroundColor: colors.backgroundSec,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      gap: spacing.sm,
      marginRight: spacing.sm,
    },
    addressTextWrap: {
      flexShrink: 1,
    },
    addressLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fonts.medium,
    },
    addressLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    addressValue: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      flexShrink: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.error,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
  });
}
