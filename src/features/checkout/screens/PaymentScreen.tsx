import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BadgePercent } from 'lucide-react-native';

import { Button, Header } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { useAddresses } from '@/features/addresses/hooks/useAddresses';
import { getAddressBlocker } from '@/features/addresses/utils/addressReadiness';
import { useCheckoutStore } from '@/store/checkoutStore';
import { flushCartSync, useCartStore } from '@/store/cartStore';
import { useCartItems } from '@/features/cart/hooks/useCartItems';
import { PriceDetailsCard } from '@/features/cart/components/PriceDetailsCard';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import { AddressSummaryCard } from '../components/AddressSummaryCard';
import { OrderItemsSummary } from '../components/OrderItemsSummary';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import {
  getErrorCode,
  getErrorMessage,
  getErrorStatus,
} from '../utils/getErrorMessage';
import type { PaymentMethod } from '../types/checkout.types';
import { DELIVERY_ETA_MINUTES } from './ConfirmLocationScreen';

type PaymentNavigationProp = NativeStackNavigationProp<MainStackParamList>;

/**
 * Final checkout step - payment method, a read-only recap of the chosen
 * address/items, the real bill breakdown (`PriceDetailsCard`, the same
 * component `CartScreen` uses - one source of truth for every money
 * figure instead of a second hand-built breakdown here), and "Place
 * Order". Placing an order is a real call (`POST /api/v1/orders/` - see
 * `usePlaceOrder`/`checkoutApi.ts`), not a stub - it converts whatever's
 * currently in the shopper's server cart. Recipient name/phone for the
 * order come straight from the selected address's own `contact_name`/
 * `contact_mobile` (see `buildOrderAddress`'s own comment) - this screen
 * no longer needs the shopper's profile for that.
 */
export function PaymentScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PaymentNavigationProp>();

  const { data: addresses = [] } = useAddresses();
  const selectedAddressId = useCheckoutStore(state => state.selectedAddressId);
  const { lines, totals, itemCount } = useCartItems();
  const placeOrder = usePlaceOrder();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const selectedAddress = addresses.find(
    a => a.address_id === selectedAddressId,
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  // "Change" goes back to ConfirmLocationScreen - picking an address only
  // ever happens there (see that screen's own comment on `useCheckoutStore`).
  const handleChangeAddress = useCallback(
    () => navigation.goBack(),
    [navigation],
  );

  const totalSavings =
    totals.discount +
    totals.deliveryDiscount +
    totals.appliedOffers.reduce((sum, offer) => sum + offer.discountAmount, 0);

  /** Turns a failed `POST /orders/` into advice the shopper can act on. */
  const handlePlaceOrderError = useCallback(
    (error: unknown) => {
      const code = getErrorCode(error);
      const status = getErrorStatus(error);
      if (code === 'STORE_CLOSED') {
        Alert.alert(
          'Store is closed',
          `${getErrorMessage(error)}\n\nYour cart is saved - try again when we reopen.`,
        );
      } else if (code === 'MINIMUM_ORDER_AMOUNT') {
        Alert.alert('Minimum order not met', getErrorMessage(error), [
          { text: 'Back to cart', onPress: () => navigation.popToTop() },
        ]);
        useCartStore.getState().hydrateFromServer();
      } else if (
        code === 'DELIVERY_UNAVAILABLE' ||
        code === 'OUTSIDE_DELIVERY_AREA' ||
        code === 'DELIVERY_LOCATION_REQUIRED' ||
        code === 'DELIVERY_ADDRESS_NOT_FOUND'
      ) {
        Alert.alert('Delivery address problem', getErrorMessage(error), [
          { text: 'Change address', onPress: () => navigation.goBack() },
        ]);
      } else if (status === 409) {
        // `OrderAlreadyPlacedFromCart`: the cart was already converted
        // (e.g. the first attempt succeeded but its response was lost).
        Alert.alert(
          'Order already placed',
          'This cart was already ordered. Check your orders for the details.',
          [
            {
              text: 'View orders',
              onPress: () => {
                useCartStore.getState().resetCart();
                useCartStore.getState().hydrateFromServer();
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Tabs', params: { screen: 'Home' } },
                    { name: 'Orders' },
                  ],
                });
              },
            },
          ],
        );
      } else if (status === undefined) {
        // No response at all - the order MAY have been created.
        Alert.alert(
          'Connection problem',
          "We couldn't confirm your order. Check My Orders before trying again so you don't order twice.",
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Could not place order', getErrorMessage(error));
      }
    },
    [navigation],
  );

  // Guards the whole async "verify cart -> place order" window (the
  // mutation's own `isPending` only covers the last step), so a fast
  // double-tap can never fire two orders.
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishSubmitting = useCallback(() => {
    submittingRef.current = false;
    setIsSubmitting(false);
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (submittingRef.current || placeOrder.isPending) return;
    if (!selectedAddress) {
      Alert.alert(
        'Choose a delivery address',
        'Go back and pick where this order should be delivered.',
      );
      return;
    }
    const blocker = getAddressBlocker(selectedAddress);
    if (blocker) {
      Alert.alert('Check the delivery address', blocker);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    // True once the mutation owns the "submitting" state (its `onSettled`
    // releases it); every other exit releases it in `finally`.
    let handedOff = false;
    try {
      // 1. Make sure every local cart edit has reached the server - the
      //    order is built from the SERVER cart, not what's on screen.
      const synced = await flushCartSync();
      if (!synced) {
        Alert.alert(
          "Couldn't sync your cart",
          'Check your connection and try again - your cart is unchanged.',
        );
        return;
      }

      // 2. Re-read it and compare with what the shopper just reviewed:
      //    prices/offers/stock can move between "add to cart" and now.
      const reviewedTotal = totals.toPay;
      await useCartStore.getState().hydrateFromServer();
      const fresh = useCartStore.getState().serverCart;
      if (!fresh || fresh.items.length === 0) {
        Alert.alert('Your cart is empty', 'Add something before checking out.');
        navigation.goBack();
        return;
      }
      if (Math.abs((fresh.grand_total ?? 0) - reviewedTotal) > 0.009) {
        Alert.alert(
          'Your total changed',
          `The payable amount is now ₹${fresh.grand_total} (was ₹${reviewedTotal}). Review it and place the order again.`,
        );
        return;
      }
      const minimum = Number(
        fresh.minimumOrderAmount ?? fresh.deliveryArea?.minimumOrderAmount ?? 0,
      );
      if (Number.isFinite(minimum) && fresh.items_subtotal < minimum) {
        Alert.alert(
          'Minimum order not met',
          `Orders to this area need at least ₹${minimum} of items. Add ₹${Math.ceil(
            minimum - fresh.items_subtotal,
          )} more.`,
        );
        return;
      }

      // 3. Place it. No money fields are sent - the server prices the
      //    order itself from the cart + address.
      handedOff = true;
      placeOrder.mutate(
        {
          delivery_address_id: selectedAddress.address_id,
          coupon_code: fresh.cart.coupon_code ?? undefined,
        },
        {
          onSuccess: order => {
            // The server converted the cart: drop the local copy WITHOUT a
            // DELETE call (`clearCart` would wipe the brand-new empty cart
            // too and race the conversion), then pull the fresh one.
            useCartStore.getState().resetCart();
            useCartStore.getState().hydrateFromServer();
            navigation.reset({
              index: 1,
              routes: [
                { name: 'Tabs', params: { screen: 'Home' } },
                {
                  name: 'OrderSuccess',
                  params: {
                    orderId: order.order_id,
                    orderNumber: order.order_number,
                    totalAmount: Number(order.total_amount),
                    etaMinutes:
                      totals.estimatedDeliveryMinutes ?? DELIVERY_ETA_MINUTES,
                  },
                },
              ],
            });
          },
          onError: error => handlePlaceOrderError(error),
          onSettled: finishSubmitting,
        },
      );
    } catch (error) {
      Alert.alert('Could not place order', getErrorMessage(error));
    } finally {
      if (!handedOff) finishSubmitting();
    }
  }, [
    placeOrder,
    selectedAddress,
    totals.toPay,
    totals.estimatedDeliveryMinutes,
    navigation,
    finishSubmitting,
    handlePlaceOrderError,
  ]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header title="Payment" onBackPress={handleGoBack} style={styles.header} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <PaymentMethodCard selected={paymentMethod} onSelect={setPaymentMethod} />

        {selectedAddress ? (
          <AddressSummaryCard
            address={selectedAddress}
            deliveryEtaMinutes={totals.estimatedDeliveryMinutes ?? DELIVERY_ETA_MINUTES}
            onChange={handleChangeAddress}
          />
        ) : null}

        <OrderItemsSummary lines={lines} itemCount={itemCount} />

        <PriceDetailsCard totals={totals} />

        {totalSavings > 0 ? (
          <View style={styles.savingsBanner}>
            <BadgePercent color={colors.success} size={16} strokeWidth={2.5} />
            <Text style={styles.savingsText}>
              You saved ₹{totalSavings} on this order
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={isSubmitting || placeOrder.isPending}
          disabled={!totals.isBackendSourced}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    savingsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: `${colors.success}1A`,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
    },
    savingsText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.success,
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
  });
}
