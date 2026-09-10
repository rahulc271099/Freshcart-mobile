import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Root-level shape of the whole app's navigation. `RootNavigator` switches
 * between `AuthNavigator` and `MainNavigator` by conditionally rendering one
 * or the other (see RootNavigator.tsx) rather than via its own
 * `Stack.Navigator` — this type exists so `useNavigation`/`useRoute` calls
 * anywhere in the app stay correctly typed against the full app shape
 * regardless of that implementation detail.
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

/**
 * Unauthenticated flow. Screens themselves are not implemented yet (auth
 * UI/logic belongs to `features/auth`, built separately) — this only wires
 * up the navigator shape shown in the F&V UI flow (Login → OTP).
 */
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  // The mobile number lives on the route rather than a shared store since
  // it's only needed to display/resend/verify OTP on the very next screen -
  // see LoginScreen's `handleContinue`.
  OTPVerification: { phoneNumber: string; otp?: string };
};

/**
 * Authenticated flow. `Tabs` hosts the bottom tab navigator (`AppTabs`).
 * Modeled as its own stack — rather than mounting `AppTabs` directly at the
 * root of the authenticated flow — specifically so screens outside the tab
 * bar can be pushed here later as sibling routes that cover the tab bar,
 * e.g.:
 *   Home (tab)  → ProductDetails
 *   Cart (tab)  → Checkout → Payment → OrderSuccess
 * Those screens are intentionally not added yet — this task only prepares
 * the structure for them.
 */
export type MainStackParamList = {
  Tabs: NavigatorScreenParams<AppTabsParamList>;
  // Pushed outside the tab bar - see the comment above this type.
  Search: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  // `addressId` present = editing that address; absent = adding a new one.
  AddEditAddress: { addressId?: string } | undefined;
  // Looked up against `features/home/data/products.ts`'s `ALL_PRODUCTS`
  // catalog by id - see ProductDetailsScreen's own comment for why a
  // plain id (not the full Product object) is passed through the route.
  ProductDetails: { productId: string };
};

/**
 * Bottom tab routes for the authenticated app.
 */
export type AppTabsParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
