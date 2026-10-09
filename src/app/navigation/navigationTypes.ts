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
 * bar can be pushed here as sibling routes that cover the tab bar, e.g.:
 *   Home (tab)  → ProductDetails
 *   Cart (tab)  → Checkout → Payment → OrderSuccess
 * `Checkout`/`Payment` read the selected address/cart straight from
 * `useCheckoutStore`/`useCartStore` rather than route params - see
 * `features/checkout/screens/ConfirmLocationScreen.tsx`'s own comment.
 */
export type MainStackParamList = {
  Tabs: NavigatorScreenParams<AppTabsParamList>;
  // Pushed outside the tab bar - see the comment above this type.
  Search: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  // Delivery-area picker (pincode search) - see features/location.
  SelectLocation: undefined;
  // First-run gate (no saved area yet): the same picker with no back
  // button. Deliberately a DIFFERENT route name from `SelectLocation` -
  // see `LocationGateNavigator` for why.
  LocationGate: { required?: boolean } | undefined;
  // `addressId` present = editing that address; absent = adding a new one.
  // Real backend PK (`AddressSerializer.address_id`) is an integer.
  AddEditAddress:
    | {
        addressId?: number;
        selectedCoordinates?: { latitude: number; longitude: number };
      }
    | undefined;
  AddressLocation: {
    initialCoordinates?: { latitude: number; longitude: number };
    addressId?: number;
  };
  // Looked up against `features/home/data/products.ts`'s `ALL_PRODUCTS`
  // catalog by id - see ProductDetailsScreen's own comment for why a
  // plain id (not the full Product object) is passed through the route.
  ProductDetails: { productId: string };
  // "Confirm Location" step of checkout - see `features/checkout/screens/
  // ConfirmLocationScreen.tsx`.
  Checkout: undefined;
  // Final checkout step - see `features/checkout/screens/PaymentScreen.tsx`.
  Payment: undefined;
  // Confirmation after a placed order - reached via `navigation.reset`.
  OrderSuccess: {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    etaMinutes?: number | null;
  };
  // Order history - see `features/orders`.
  Orders: undefined;
  // "See all" for one Home campaign - see `features/home`.
  CampaignProducts: { campaignId: number; title: string };
};

/**
 * Bottom tab routes for the authenticated app.
 */
export type AppTabsParamList = {
  Home: undefined;
  // `groupId` preselects that group in the sidebar (Home's group strip).
  Categories: { groupId?: number } | undefined;
  Cart: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
