import React, { useMemo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  fonts,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Generic screen header: optional back button, optional title/subtitle,
 * optional trailing accessory. Contains no navigation or feature logic -
 * screens supply callbacks and content through props.
 */
export function Header({
  title,
  subtitle,
  onBackPress,
  rightAccessory,
  style,
  testID,
}: HeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.side}>
        {onBackPress ? (
          <Pressable
            onPress={onBackPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <View style={styles.titleGroup}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.titleGroup} />
      )}

      <View style={styles.side}>{rightAccessory}</View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: spacing.sm,
    },
    side: {
      minWidth: 32,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: typography.heading1.fontSize,
      lineHeight: typography.heading1.lineHeight,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    titleGroup: {
      flex: 1,
      marginLeft: spacing.sm,
    },
    title: {
      ...typography.heading3,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
  });
}
