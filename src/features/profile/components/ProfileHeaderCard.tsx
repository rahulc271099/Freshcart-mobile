import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface ProfileHeaderCardProps {
  name: string;
  phone: string;
  /** The whole card is tappable - taps anywhere on it open Edit Profile.
   * The trailing edit (pencil) icon is a visual affordance only, not a
   * second separately-hit-tested button. */
  onPress: () => void;
}

/** Turns "Rahul C" into "RC", "Rahul" into "R" - avatar placeholder until
 * real profile photos exist. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProfileHeaderCard({
  name,
  phone,
  onPress,
}: ProfileHeaderCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Edit profile"
    >
      {/* Purely decorative - clipped by the card's own rounded corners
          (`overflow: hidden` below) so they never bleed outside it. */}
      <View style={styles.blobLarge} pointerEvents="none" />
      <View style={styles.blobSmall} pointerEvents="none" />

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.phone} numberOfLines={1}>
          {phone}
        </Text>
      </View>

      {/* Edit affordance pinned to the right end of the card, vertically
          centered with the avatar/name block - not inline with the name
          text itself. */}
      <icons.edit color={colors.textInverse} size={18} strokeWidth={2} />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      padding: spacing.md,
      overflow: 'hidden',
      position: 'relative',
    },
    pressed: {
      opacity: 0.92,
    },
    blobLarge: {
      position: 'absolute',
      top: -44,
      right: -28,
      width: 140,
      height: 140,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    blobSmall: {
      position: 'absolute',
      bottom: -22,
      left: -12,
      width: 72,
      height: 72,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.textInverse,
      fontSize: 22,
      fontFamily: fonts.bold,
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.textInverse,
    },
    phone: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
  });
}
