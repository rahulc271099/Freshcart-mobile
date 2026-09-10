import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppTabs } from './AppTabs';
import { TabBarVisibilityProvider } from './TabBarVisibilityContext';
import { SearchScreen } from '@/features/search/screens/SearchScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { AddressesScreen } from '@/features/addresses/screens/AddressesScreen';
import { AddEditAddressScreen } from '@/features/addresses/screens/AddEditAddressScreen';
import { ProductDetailsScreen } from '@/features/product/screens/ProductDetailsScreen';
import type { MainStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Authenticated flow. Wraps `AppTabs` (the bottom tab bar) as the initial
 * stack screen — rather than mounting the tab navigator directly — so
 * screens outside the tab bar (ProductDetails, Checkout, Payment,
 * OrderSuccess, ...) can be pushed here later as sibling `Stack.Screen`s
 * that cover the tab bar, without restructuring this navigator.
 *
 * `Search`, `Profile`, `EditProfile`, `Addresses` and `AddEditAddress` are
 * all such siblings - pushed from within tab screens, covering the tab bar
 * the same way a real full-screen takeover would.
 *
 * `TabBarVisibilityProvider` sits here (above `AppTabs`) rather than inside
 * it, so the shared scroll-driven visibility value is reachable both by
 * `AppTabs` itself (to animate the bar) and by the screens it renders
 * (e.g. `HomeScreen`, to drive the value from scroll position).
 */
export function MainNavigator() {
  return (
    <TabBarVisibilityProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={AppTabs} />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      </Stack.Navigator>
    </TabBarVisibilityProvider>
  );
}
