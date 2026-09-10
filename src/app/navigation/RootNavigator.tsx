import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

/**
 * Top-level auth switch and the app's single `NavigationContainer`.
 * Reads `isAuthenticated` from the persisted Zustand authStore — when
 * `useVerifyOtp` calls `setSession(token)` on successful OTP verification,
 * this component re-renders automatically and switches to MainNavigator.
 */
export function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { colors, dark } = useTheme();

  const navigationTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
