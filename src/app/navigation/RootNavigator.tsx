import React, { useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCheckoutStore } from '@/store/checkoutStore';
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

  // Reconcile the local cart against the server's real one exactly once
  // per session, right when the app has a session to call the API with -
  // covers both a fresh login and reopening the app with a persisted
  // session. `cartStore.ts` never reads the server cart back on its own
  // otherwise (every mutation there is write-only/best-effort), so
  // without this a different device, a reinstall, or an earlier silently
  // failed sync (see `logSyncError`) would leave the app showing a cart
  // that doesn't match what the server actually has.
  //
  // The reverse matters just as much: the moment the session ends
  // (logout OR an expired/refused token) the persisted cart, the pending
  // sync queue and the checkout address pick belong to the PREVIOUS
  // account - without wiping them here, the next person to sign in on
  // this device would see (and could even order) someone else's cart.
  useEffect(() => {
    if (!isAuthenticated) {
      useCartStore.getState().resetCart();
      useCheckoutStore.getState().setSelectedAddressId(null);
      return;
    }
    useCartStore.getState().hydrateFromServer();
  }, [isAuthenticated]);

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
