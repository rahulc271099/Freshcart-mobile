import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

export interface SidebarCategory {
  id: string;
  label: string;
  imageUri: string;
}

interface CategorySidebarItemProps {
  category: SidebarCategory;
  isActive: boolean;
  onPress: (id: string) => void;
}

export function CategorySidebarItem({
  category,
  isActive,
  onPress,
}: CategorySidebarItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={[styles.item, isActive && styles.itemActive]}
      onPress={() => onPress(category.id)}
    >
      <Image
        source={{ uri: category.imageUri }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text
        style={[styles.label, isActive && styles.labelActive]}
        numberOfLines={3}
      >
        {category.label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    item: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: 'transparent',
      marginBottom: spacing.xs,
    },
    // Whole-card highlight (light mint fill + a thin green border), matching
    // the reference design's active sidebar state - rather than just
    // outlining the thumbnail image.
    itemActive: {
      backgroundColor: '#EEF5EC',
      borderColor: '#BFE3C4',
    },
    image: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    label: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 13,
      fontFamily: fonts.medium,
    },
    labelActive: {
      color: colors.primary,
      fontFamily: fonts.bold,
    },
  });
}
