import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppTabs } from './AppTabs';
import { TabBarVisibilityProvider } from './TabBarVisibilityContext';
import { CampaignProductsScreen } from '@/features/home/screens/CampaignProductsScreen';
import { SearchScreen } from '@/features/search/screens/SearchScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { SelectLocationScreen } from '@/features/location/screens/SelectLocationScreen';
import { AddressesScreen } from '@/features/addresses/screens/AddressesScreen';
import { AddressLocationScreen } from '@/features/addresses/screens/AddressLocationScreen';
import { AddEditAddressScreen } from '@/features/addresses/screens/AddEditAddressScreen';
import { ProductDetailsScreen } from '@/features/product/screens/ProductDetailsScreen';
import { ConfirmLocationScreen } from '@/features/checkout/screens/ConfirmLocationScreen';
import { PaymentScreen } from '@/features/checkout/screens/PaymentScreen';
import { OrderSuccessScreen } from '@/features/orders/screens/OrderSuccessScreen';
import { OrdersScreen } from '@/features/orders/screens/OrdersScreen';
import { Loader } from '@/components';
import { useSelectedDeliveryArea } from '@/features/location/hooks/useDeliveryLocation';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import type { MainStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<MainStackParamList>();

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

/**
 * Single-screen stack shown before any delivery area is saved.
 *
 * Its route is named `LocationGate`, NOT `SelectLocation`, on purpose: the
 * app has one `NavigationContainer`, so when this stack is swapped for the
 * full one React Navigation carries the existing route state across and
 * keeps every route whose NAME still exists. A gate route named
 * `SelectLocation` survived the swap (the full stack has that name too),
 * leaving the shopper on the picker with Tabs never mounted. A name the
 * full stack doesn't have is dropped, so it starts fresh on Tabs.
 */
function LocationGateNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, gestureEnabled: false }}
    >
      <Stack.Screen
        name="LocationGate"
        component={SelectLocationScreen}
        initialParams={{ required: true }}
      />
    </Stack.Navigator>
  );
}

/**
 * Authenticated flow. Wraps `AppTabs` (the bottom tab bar) as the initial
 * stack screen — rather than mounting the tab navigator directly — so
 * screens outside the tab bar (ProductDetails, Checkout, Payment,
 * OrderSuccess, ...) can be pushed here later as sibling `Stack.Screen`s
 * that cover the tab bar, without restructuring this navigator.
 *
 * `Search`, `Profile`, `EditProfile`, `Addresses`, `AddEditAddress`,
 * `Checkout` and `Payment` are all such siblings - pushed from within tab
 * screens, covering the tab bar the same way a real full-screen takeover
 * would. `Checkout` (`ConfirmLocationScreen`) → `Payment` (`PaymentScreen`)
 * is the checkout flow out of `CartScreen`'s "Proceed to Checkout" - see
 * `features/checkout/`.
 *
 * `TabBarVisibilityProvider` sits here (above `AppTabs`) rather than inside
 * it, so the shared scroll-driven visibility value is reachable both by
 * `AppTabs` itself (to animate the bar) and by the screens it renders
 * (e.g. `HomeScreen`, to drive the value from scroll position).
 */
export function MainNavigator() {
  const { colors } = useTheme();
  const { data: selectedArea, isLoading, isError } = useSelectedDeliveryArea();
  const locationConfirmed = useAppStore(state => state.locationConfirmed);

  // Forget the confirmation when the signed-in flow goes away (logout), so
  // the next account is asked for its own delivery area.
  useEffect(() => () => useAppStore.getState().setLocationConfirmed(false), []);

  // Location gate (Instamart pattern): the dashboard is never shown before
  // a delivery area is known. Ask the server first...
  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <Loader size="large" />
      </View>
    );
  }

  // ...and with no saved area (new account, or the saved one stopped being
  // serviceable) show ONLY the picker, with no back button. Saving an area
  // (`locationConfirmed`, plus the refreshed query) swaps this for the full
  // navigator below.
  // If the lookup itself failed (offline/server error) don't lock the
  // shopper out - fall through to the app; the Home header still lets
  // them choose a location.
  if (!isError && selectedArea == null && !locationConfirmed) {
    return <LocationGateNavigator />;
  }

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
        <Stack.Screen name="SelectLocation" component={SelectLocationScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
        <Stack.Screen
          name="AddressLocation"
          component={AddressLocationScreen}
        />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen
          name="CampaignProducts"
          component={CampaignProductsScreen}
        />
        <Stack.Screen name="Checkout" component={ConfirmLocationScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen
          name="OrderSuccess"
          component={OrderSuccessScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Orders" component={OrdersScreen} />
      </Stack.Navigator>
    </TabBarVisibilityProvider>
  );
}
