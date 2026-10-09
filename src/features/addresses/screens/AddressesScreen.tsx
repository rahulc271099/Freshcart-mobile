import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin } from 'lucide-react-native';

import { Button, ErrorView, Header, Loader } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { fonts, spacing, useTheme, type ThemeColors } from '@/theme';
import { AddressCard } from '../components/AddressCard';
import { useAddresses } from '../hooks/useAddresses';
import { useDeleteAddress } from '../hooks/useDeleteAddress';
import { useSetDefaultAddress } from '../hooks/useSetDefaultAddress';
import { addressTypeLabel } from '../utils/formatAddress';
import type { Address } from '../types/address.types';

/**
 * Reads straight off the real `GET /users/me/addresses/` endpoint (via
 * `useAddresses`, a TanStack Query hook shared with the checkout flow) -
 * previously this screen ran on a local, MMKV-persisted, demo-seeded
 * Zustand store that never called the real API at all.
 */
export function AddressesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const { data: addresses = [], isLoading, isError, refetch } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleDelete = useCallback(
    (address: Address) => {
      Alert.alert(
        `Delete ${addressTypeLabel(address.address_type)} address?`,
        'This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () =>
              deleteAddress.mutate(address.address_id, {
                onError: error => {
                  console.log('🚀 ~ AddressesScreen ~ delete error:', error);
                  Alert.alert(
                    'Could not delete address',
                    'Please try again.',
                  );
                },
              }),
          },
        ],
      );
    },
    [deleteAddress],
  );

  const handleSetDefault = useCallback(
    (address: Address) => {
      setDefaultAddress.mutate(address.address_id, {
        onError: error => {
          console.log('🚀 ~ AddressesScreen ~ set-default error:', error);
          Alert.alert('Could not update default address', 'Please try again.');
        },
      });
    },
    [setDefaultAddress],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header
        title="Addresses"
        onBackPress={handleGoBack}
        style={styles.header}
      />

      {isLoading ? (
        <Loader fullscreen />
      ) : isError ? (
        <ErrorView title="Couldn't load your addresses" onRetry={refetch} />
      ) : addresses.length === 0 ? (
        <View style={styles.empty}>
          <MapPin color={colors.textSecondary} size={40} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySubtitle}>
            Add an address so checkout is faster next time.
          </Text>
          <Button
            title="Add Address"
            onPress={() => navigation.navigate('AddEditAddress', {})}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => String(item.address_id)}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              onEdit={() =>
                navigation.navigate('AddEditAddress', {
                  addressId: item.address_id,
                })
              }
              onDelete={() => handleDelete(item)}
              onSetDefault={() => handleSetDefault(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Button
              title="+ Add New Address"
              variant="outline"
              onPress={() => navigation.navigate('AddEditAddress', {})}
              style={styles.addBtn}
            />
          }
        />
      )}
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
    },
    list: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    addBtn: {
      marginHorizontal: spacing.md,
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
  });
}
