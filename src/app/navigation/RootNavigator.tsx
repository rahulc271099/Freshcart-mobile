import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuthStore } from '../../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

/**
 * Top-level auth switch. No navigation logic belongs inside `AuthNavigator`
 * or `MainNavigator` themselves — this is the one place that decides which
 * of the two the user sees, based on client auth state.
 */
export function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
