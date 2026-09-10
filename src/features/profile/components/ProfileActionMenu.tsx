import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { icons } from '@/constants/icons';
import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

interface ProfileActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

/**
 * The "⋯" menu on ProfileScreen's header - just Logout for now (see
 * ProfileScreen's own comment for other candidates: Delete Account,
 * Share App, Language, ...). A plain RN `Modal` (transparent, fade) rather
 * than the app's own `BottomSheet`/`Modal` components, both of which are
 * still empty placeholders - this avoids depending on unbuilt UI.
 * Positioned near the top-right (under where the "⋯" button sits) rather
 * than measuring the button's exact position, which keeps this simple and
 * correct across devices without a layout-measurement round trip.
 */
export function ProfileActionMenu({
  visible,
  onClose,
  onLogout,
}: ProfileActionMenuProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.card, { top: insets.top + 48 }]}>
          <Pressable
            style={styles.item}
            onPress={() => {
              onClose();
              onLogout();
            }}
            accessibilityRole="button"
          >
            <icons.logout color={colors.error} size={18} strokeWidth={2} />
            <Text style={styles.itemText}>Log out</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    card: {
      position: 'absolute',
      right: spacing.md,
      minWidth: 160,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.md,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    itemText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
  });
}
