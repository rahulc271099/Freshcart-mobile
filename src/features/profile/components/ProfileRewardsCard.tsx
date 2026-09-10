import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface ProfileRewardsCardProps {
  /** Dummy points balance until a real rewards feature/endpoint exists. */
  points: number;
  onPress: () => void;
}

/** "Fresh Rewards" teaser card shown just below the profile header - purely
 * a coming-soon affordance today (see ProfileScreen's `showComingSoon`). */
export function ProfileRewardsCard({
  points,
  onPress,
}: ProfileRewardsCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>
        <icons.tag color={colors.primary} size={20} strokeWidth={2} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>Fresh Rewards</Text>
        <Text style={styles.subtitle}>{points} points available</Text>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>View Rewards</Text>
        <icons.chevronRight color={colors.primary} size={16} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      padding: spacing.sm + 2,
    },
    pressed: {
      opacity: 0.85,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    ctaText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
}
