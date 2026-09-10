import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';

import { fonts, spacing, useTheme, type ThemeColors } from '@/theme';

interface Category {
  id: string;
  label: string;
  emoji?: string;
  isMore?: boolean;
}

const CATEGORIES: Category[] = [
  { id: 'vegetables', label: 'Vegetables', emoji: '🥦' },
  { id: 'fruits', label: 'Fruits', emoji: '🍎' },
  { id: 'leafy', label: 'Leafy Greens', emoji: '🥬' },
  { id: 'herbs', label: 'Herbs', emoji: '🌿' },
  { id: 'more', label: 'More', isMore: true },
];

interface CategoryRowProps {
  onCategoryPress?: (id: string) => void;
}

export function CategoryRow({ onCategoryPress }: CategoryRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map(cat => (
        <Pressable
          key={cat.id}
          style={styles.item}
          onPress={() => onCategoryPress?.(cat.id)}
        >
          <View style={styles.iconWrap}>
            {cat.isMore ? (
              <LayoutGrid color={colors.textPrimary} size={20} />
            ) : (
              <Text style={styles.emoji}>{cat.emoji}</Text>
            )}
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {cat.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      gap: spacing.sm,
    },
    item: {
      alignItems: 'center',
      width: 56,
    },
    // No circle/background/border anymore - just a plain sizing box so the
    // icon/emoji and label below it stay aligned, slightly smaller overall
    // than before (48 -> was effectively 60 via the old circle).
    iconWrap: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: {
      fontSize: 24,
    },
    label: {
      fontSize: 10,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
      marginTop: 2,
      textAlign: 'center',
    },
  });
}
