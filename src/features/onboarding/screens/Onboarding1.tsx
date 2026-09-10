import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, ScreenContainer } from '@/components';
import { spacing, typography, useTheme, type ThemeColors } from '@/theme';
import type { AuthStackParamList } from '@/app/navigation/navigationTypes';

type OnboardingNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Onboarding'
>;

/**
 * Basic first-launch screen shown before Login. Deliberately minimal - a
 * proper multi-slide onboarding carousel (see `features/onboarding/components`)
 * can replace this body later without touching how it's wired into
 * `AuthNavigator` or the `Login` handoff below.
 */
export const Onboarding1 = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleGetStarted = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.logoRow}>
          <Text style={styles.logoF}>F</Text>
          <Text style={styles.logoAmp}>&</Text>
          <Text style={styles.logoV}>V</Text>
        </View>
        <Text style={styles.tagline}>Fresh. Natural. Delivered.</Text>

        <Text style={styles.title}>Farm-fresh groceries, delivered fast</Text>
        <Text style={styles.subtitle}>
          Handpicked fruits &amp; vegetables at the best prices, delivered right
          to your door.
        </Text>
      </View>

      <Button
        title="Get Started"
        onPress={handleGetStarted}
        fullWidth
        style={styles.button}
      />
    </ScreenContainer>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    logoF: {
      ...typography.heading1,
      color: colors.primary,
    },
    logoAmp: {
      ...typography.heading1,
      color: colors.secondary,
    },
    logoV: {
      ...typography.heading1,
      color: colors.primary,
    },
    tagline: {
      ...typography.body,
      color: colors.primary,
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.heading2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    button: {
      marginBottom: spacing.lg,
    },
  });
}
