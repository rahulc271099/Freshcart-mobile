import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Search } from 'lucide-react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface HomeSearchBarProps {
  onPress: () => void;
}

/**
 * Full-width search bar directly below the delivery header. Deliberately
 * NOT a live text field here - tapping it navigates to `SearchScreen`,
 * which owns the real input/recent/popular/live-results UI. This keeps the
 * bar itself to exactly what the spec asks for: a search icon, placeholder
 * copy, nothing else (no location/cart/wishlist/filter icons crammed in).
 */
export function HomeSearchBar({ onPress }: HomeSearchBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={styles.bar}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Search fruits, vegetables..."
    >
      <Search color={colors.primary} size={18} strokeWidth={2} />
      <Text style={styles.placeholder} numberOfLines={1}>
        Search fruits, vegetables...
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      paddingHorizontal: spacing.md,
      height: 44,
      backgroundColor: colors.backgroundSec,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
    },
    placeholder: {
      flex: 1,
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}
