import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPinned } from 'lucide-react-native';

import { Button, ErrorView, Header, Loader } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { useAddresses } from '@/features/addresses/hooks/useAddresses';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCartItems } from '@/features/cart/hooks/useCartItems';
import { fonts, spacing, useTheme, type ThemeColors } from '@/theme';
import { getAddressBlocker } from '@/features/addresses/utils/addressReadiness';
import { AddressOptionCard } from '../components/AddressOptionCard';
import { useSelectAddress } from '../hooks/useSelectAddress';
import { getErrorCode, getErrorMessage } from '../utils/getErrorMessage';

/** Static placeholder - there's no real delivery-estimate endpoint yet,
 * same spirit as CartScreen's own MAXXSAVER_THRESHOLD placeholder.
 * `PaymentScreen`'s `AddressSummaryCard` uses the same constant so both
 * checkout screens agree. TODO: replace with a real ETA once one exists. */
export const DELIVERY_ETA_MINUTES = 60;

type ConfirmLocationNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

/**
 * First step of checkout - choose which saved address an order ships to.
 * Reads straight off the real `/users/me/addresses/` API via
 * `useAddresses` (a TanStack Query hook shared with `AddressesScreen`/
 * `PaymentScreen` through one cache entry), so an address added/edited on
 * `AddressesScreen` is reflected here as soon as that mutation's
 * invalidation lands - previously this read a local, demo-seeded Zustand
 * store that never touched the real backend. Selection itself lives in
 * `useCheckoutStore` - see that store's own comment for why it's
 * deliberately not the same thing as an address's `is_default` flag.
 */
export function ConfirmLocationScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ConfirmLocationNavigationProp>();

  const { data: addresses = [], isLoading, isError, refetch } = useAddresses();
  const selectedAddressId = useCheckoutStore(state => state.selectedAddressId);
  const setSelectedAddressId = useCheckoutStore(
    state => state.setSelectedAddressId,
  );
  const { itemCount, totals } = useCartItems();
  const selectAddress = useSelectAddress();

  // Seed a selection the first time this screen sees addresses load (or
  // if the previously-selected address was deleted / became unusable) -
  // prefers the account's default address, falling back to whichever is
  // first. Only addresses the backend can actually deliver to count
  // (`getAddressBlocker`); if none qualify the selection stays empty and
  // "Proceed" stays disabled until the shopper fixes or adds one.
  useEffect(() => {
    const usable = addresses.filter(a => !getAddressBlocker(a));
    if (usable.length === 0) {
      if (selectedAddressId != null) setSelectedAddressId(null);
      return;
    }
    if (usable.some(a => a.address_id === selectedAddressId)) return;
    const fallback = usable.find(a => a.is_default) ?? usable[0];
    setSelectedAddressId(fallback.address_id);
  }, [addresses, selectedAddressId, setSelectedAddressId]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleAddAddress = useCallback(
    () => navigation.navigate('AddEditAddress', {}),
    [navigation],
  );
  const handleEditAddress = useCallback(
    (addressId: number) => navigation.navigate('AddEditAddress', { addressId }),
    [navigation],
  );

  // Pin the chosen address on the SERVER first: the delivery fee and the
  // minimum-order rule are quoted per area from the saved selection, so
  // the Payment screen must see the numbers for THIS address - and an
  // address the backend refuses is caught here, not after "Place Order".
  const handleProceed = useCallback(() => {
    if (!selectedAddressId || selectAddress.isPending) return;
    selectAddress.mutate(selectedAddressId, {
      onSuccess: () => navigation.navigate('Payment'),
      onError: error => {
        const code = getErrorCode(error);
        const title =
          code === 'OUTSIDE_DELIVERY_AREA' || code === 'DELIVERY_UNAVAILABLE'
            ? "We don't deliver to this address"
            : "Couldn't use this address";
        Alert.alert(title, getErrorMessage(error));
      },
    });
  }, [navigation, selectedAddressId, selectAddress]);

  const showList = !isLoading && !isError;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header
        title="Confirm Location"
        subtitle="Choose where this order should be delivered"
        onBackPress={handleGoBack}
        style={styles.header}
      />

      {isLoading ? (
        <Loader fullscreen />
      ) : isError ? (
        <ErrorView title="Couldn't load your addresses" onRetry={refetch} />
      ) : addresses.length === 0 ? (
        <View style={styles.empty}>
          <MapPinned
            color={colors.textSecondary}
            size={40}
            strokeWidth={1.5}
          />
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySubtitle}>
            Add a delivery address to continue to payment.
          </Text>
          <Button
            title="Add Address"
            onPress={handleAddAddress}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => String(item.address_id)}
          renderItem={({ item }) => (
            <AddressOptionCard
              address={item}
              selected={item.address_id === selectedAddressId}
              onSelect={() => setSelectedAddressId(item.address_id)}
              blocker={getAddressBlocker(item)}
              onEdit={() => handleEditAddress(item.address_id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Button
              title="+ Add New Address"
              variant="outline"
              onPress={handleAddAddress}
              style={styles.addBtn}
            />
          }
        />
      )}

      {showList && addresses.length > 0 ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
        >
          <View style={styles.footerSummary}>
            <Text style={styles.footerItems}>
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </Text>
            <Text style={styles.footerAmount}>₹{totals.toPay}</Text>
          </View>
          <Button
            title="Proceed to Pay"
            onPress={handleProceed}
            disabled={!selectedAddressId}
            loading={selectAddress.isPending}
            style={styles.proceedBtn}
          />
        </View>
      ) : null}
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
    list: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    addBtn: {
      marginTop: spacing.xs,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    emptySubtitle: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    emptyBtn: {
      marginTop: spacing.lg,
      minWidth: 180,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    footerSummary: {
      minWidth: 70,
    },
    footerItems: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fonts.medium,
    },
    footerAmount: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      marginTop: 1,
    },
    proceedBtn: {
      flex: 1,
    },
  });
}
