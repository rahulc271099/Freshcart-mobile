import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bike, Leaf, Shield, Tag } from 'lucide-react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface Badge {
  id: string;
  // `strokeWidth` is optional here since it's what the render below passes
  // to `Icon` - without it, TS rejects `strokeWidth={2}` as an excess prop
  // the (narrower) declared type doesn't allow.
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
  { id: 'price', Icon: Tag, line1: 'Best Prices', line2: 'Guaranteed' },
  { id: 'safe', Icon: Shield, line1: 'Safe &', line2: 'Hygienic' },
];

export function FeatureBadgeRow() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {BADGES.map((badge, idx) => {
        const Icon = badge.Icon;

        return (
          <View
            key={badge.id}
            style={[styles.badge, idx < BADGES.length - 1 && styles.divider]}
          >
            <Icon color={colors.primary} size={18} strokeWidth={2} />

            <View style={styles.textWrap}>
              <Text style={styles.line1} numberOfLines={1}>
                {badge.line1}
              </Text>

              <Text style={styles.line2} numberOfLines={1}>
                {badge.line2}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    badge: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
      paddingVertical: spacing.sm,
      gap: 5,
      minWidth: 0,
    },

    divider: {
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },

    textWrap: {
      flexShrink: 1,
      minWidth: 0,
    },

    line1: {
      fontSize: 9,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
      lineHeight: 12,
    },

    line2: {
      fontSize: 8,
      color: colors.textSecondary,
      lineHeight: 11,
      fontFamily: fonts.regular,
    },
  });
}
