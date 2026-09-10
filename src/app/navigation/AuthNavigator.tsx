import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { Onboarding1 } from '@/features/onboarding/screens/Onboarding1';
import type { AuthStackParamList } from './navigationTypes';
import { OTPVerificationScreen } from '@/features/auth/screens/OTPVerificationScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Unauthenticated stack, in the order shown in the F&V UI flow. `Login` is
 * the first real screen built (see `features/auth/screens/LoginScreen`) -
 * the rest stay placeholders until built. Native headers are hidden since
 * auth screens use the app's own `Header` component instead.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={Onboarding1}/>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen}/>
    </Stack.Navigator>
  );
}
