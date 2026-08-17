import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ComingSoonScreen } from '../../components/ComingSoonScreen';
import type { AuthStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Unauthenticated stack. `Login` is a placeholder until `features/auth` is
 * built — this only proves the stack itself is wired correctly.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login">
        {() => <ComingSoonScreen label="Login" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
