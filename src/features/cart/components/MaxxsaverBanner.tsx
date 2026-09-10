import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

export interface MaxxsaverBannerProps {
  /** Amount still needed to unlock the perk. 0 (or less) means unlocked. */
  remaining: number;
  /** 0-100. Ignored once `remaining <= 0`. */
  progress: number;
  /** Perk name shown in the copy - "Maxxsaver" today, but not hardcoded here. */
  label: string;
  onViewOffers?: () => void;
}

/**
 * Cart screen's spend-threshold perk banner - either "add ₹X more to unlock
 * <label>" with a progress bar, or a one-line "<label> unlocked" once the
 * threshold is met. Pulled out of CartScreen.tsx (which otherwise composes
 * every section inline) per the project's "minimise the main screen, one
 * component per section" rule.
 */
export function MaxxsaverBanner({
  remaining,
  progress,
  label,
  onViewOffers,
}: MaxxsaverBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const unlocked = remaining <= 0;

  return (
    <View style={styles.banner}>
      <Text style={styles.emoji}>{unlocked ? '✅' : '🌿'}</Text>
      <View style={styles.content}>
        {unlocked ? (
          <Text style={styles.unlockedText} numberOfLines={1}>
            {label} unlocked on this order
          </Text>
        ) : (
          <>
            <Text style={styles.text} numberOfLines={1}>
              Add <Text style={styles.amount}>₹{remaining}</Text> more to unlock{' '}
              <Text style={styles.brand}>{label}</Text>
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` as `${number}%` },
                ]}
              />
            </View>
          </>
        )}
      </View>
      <Pressable style={styles.viewOffers} onPress={onViewOffers} hitSlop={8}>
        <Text style={styles.viewOffersText}>View Offers</Text>
        <icons.chevronRight
          color={colors.primary}
          size={14}
          strokeWidth={2.5}
        />
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.sm,
    },
    emoji: {
      fontSize: 20,
    },
    content: {
      flex: 1,
    },
    text: {
      fontSize: 12,
      color: colors.textPrimary,
    },
    amount: {
      fontFamily: fonts.bold,
      color: colors.warning,
    },
    brand: {
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    unlockedText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    progressTrack: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: radius.full,
      marginTop: 6,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: radius.full,
    },
    viewOffers: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewOffersText: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
  });
}
