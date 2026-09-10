import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bike, Leaf, Shield, Tag } from 'lucide-react-native';

import {
  fonts,
  radius,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';

interface Reason {
  id: string;
  Icon: React.ComponentType<{
    color: string;
    size: number;
    strokeWidth?: number;
  }>;
  title: string;
  subtitle: string;
}

const REASONS: Reason[] = [
  {
    id: 'fresh',
    Icon: Leaf,
    title: 'Farm Fresh',
    subtitle: 'Fresh produce, every day',
  },
  {
    id: 'delivery',
    Icon: Bike,
    title: 'Express Delivery',
    subtitle: 'Delivered in 30 mins',
  },
  {
    id: 'price',
    Icon: Tag,
    title: 'Best Prices',
    subtitle: 'Guaranteed lowest rates',
  },
  {
    id: 'safe',
    Icon: Shield,
    title: 'Safe & Hygienic',
    subtitle: 'Quality you can trust',
  },
];

/**
 * Compact, bottom-of-Home "Why FreshCart?" section - replaces the old
 * `FeatureBadgeRow` (single bordered row of 4 tiny badges up near the top).
 * Same four facts, but as a light 2x2 icon/title/subtitle grid with no
 * card border/shadow, so it reads as supporting info rather than another
 * product section competing for attention.
 */
export function WhyFreshCartSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Why FreshCart?</Text>
      <View style={styles.grid}>
        {REASONS.map(reason => {
          const Icon = reason.Icon;
          return (
            <View key={reason.id} style={styles.item}>
              <View style={styles.iconWrap}>
                <Icon color={colors.primary} size={18} strokeWidth={2} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {reason.title}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={2}>
                  {reason.subtitle}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.lg,
      marginHorizontal: spacing.md,
    },
    title: {
      ...typography.heading3,
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    item: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingRight: spacing.sm,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
    },
    itemTitle: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    itemSubtitle: {
      fontSize: 10,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 13,
      marginTop: 1,
    },
  });
}
