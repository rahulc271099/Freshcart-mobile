import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';

import { AppImage, Skeleton } from '@/components';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

/** Placeholder tiles shown while the groups load. */
const SKELETON_COUNT = 5;

/** One tile in the strip - deliberately source-agnostic (Home feeds it
 * catalogue groups, the same ones the Categories sidebar lists). */
export interface CategoryRowItem {
  id: number;
  label: string;
  imageUrl: string | null;
}

interface CategoryRowProps {
  items: CategoryRowItem[] | undefined;
  isLoading: boolean;
  /** Called with the tapped tile's id. */
  onItemPress?: (id: number) => void;
  /** The trailing "More" tile - opens the full catalogue. */
  onMorePress?: () => void;
}

/**
 * Home's group strip. Loading shows tile-shaped skeletons; an empty/failed
 * fetch renders nothing (the Categories tab is still one tap away in the
 * tab bar, and pull-to-refresh retries).
 */
export function CategoryRow({
  items,
  isLoading,
  onItemPress,
  onMorePress,
}: CategoryRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <View key={i} style={styles.item}>
            <Skeleton width={44} height={44} borderRadius={radius.full} />
            <Skeleton width={40} height={8} style={styles.skeletonLabel} />
          </View>
        ))}
      </View>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {items.map(item => {
        const label = item.label;
        return (
          <Pressable
            key={item.id}
            style={styles.item}
            onPress={() => onItemPress?.(item.id)}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <View style={styles.iconWrap}>
              {item.imageUrl ? (
                <AppImage
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                // No artwork uploaded for this group - an initial on a
                // soft disc reads as intentional rather than a blank gap.
                <View style={styles.initialDisc}>
                  <Text style={styles.initial}>
                    {label.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        style={styles.item}
        onPress={onMorePress}
        accessibilityRole="button"
        accessibilityLabel="More groups"
      >
        <View style={styles.iconWrap}>
          <LayoutGrid color={colors.textPrimary} size={20} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          More
        </Text>
      </Pressable>
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
    // No circle/background/border around the artwork - just a plain sizing
    // box so the image and the label below it stay aligned.
    iconWrap: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: 44,
      height: 44,
    },
    initialDisc: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    label: {
      fontSize: 10,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
      marginTop: 2,
      textAlign: 'center',
    },
    skeletonLabel: {
      marginTop: spacing.xs,
    },
  });
}
