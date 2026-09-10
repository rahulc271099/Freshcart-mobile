import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bike, Leaf, Shield, Sparkles } from 'lucide-react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface Badge {
  id: string;
  Icon: React.ComponentType<{
    color: string;
    size: number;
    strokeWidth?: number;
  }>;
  line1: string;
  line2: string;
}

const BADGES: Badge[] = [
  { id: 'fresh', Icon: Leaf, line1: 'Farm Fresh', line2: 'Everyday' },
  {
    id: 'delivery',
    Icon: Bike,
    line1: 'Express Delivery',
    line2: 'in 30 mins',
  },
  { id: 'price', Icon: Sparkles, line1: 'Best Prices', line2: 'Guaranteed' },
  { id: 'safe', Icon: Shield, line1: 'Safe &', line2: 'Hygienic' },
];

/**
 * Product Details' 4-column trust-badge strip - same four facts as Home's
 * `WhyFreshCartSection`, but laid out as a single bordered row (icon on
 * top, two-line label below) rather than that section's 2x2 icon-left
 * grid. Kept as its own small component (not `WhyFreshCartSection`
 * reused) since the two layouts genuinely differ - Home's grid style
 * doesn't fit under a product's price row the way this strip does.
 */
export function ProductTrustBadges() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {BADGES.map(badge => {
        const Icon = badge.Icon;
        return (
          <View key={badge.id} style={styles.item}>
            <Icon color={colors.primary} size={20} strokeWidth={1.75} />
            <Text style={styles.label} numberOfLines={1}>
              {badge.line1}
            </Text>
            <Text style={styles.label} numberOfLines={1}>
              {badge.line2}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 2,
    },
    label: {
      fontSize: 9.5,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
