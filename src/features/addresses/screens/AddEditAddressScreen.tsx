import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorView, Header, Loader } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { spacing, useTheme } from '@/theme';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { AddressForm } from '../components/AddressForm';
import { useAddresses } from '../hooks/useAddresses';
import { useCreateAddress } from '../hooks/useCreateAddress';
import { useUpdateAddress } from '../hooks/useUpdateAddress';
import { useSetDefaultAddress } from '../hooks/useSetDefaultAddress';
import { getErrorMessage } from '@/features/checkout/utils/getErrorMessage';
import { useSelectedDeliveryArea } from '@/features/location/hooks/useDeliveryLocation';
import { useCheckoutStore } from '@/store/checkoutStore';
import type { AddressInput } from '../types/address.types';

export function AddEditAddressScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'AddEditAddress'>>();
  const { data: profile } = useProfile();
  const addressId = route.params?.addressId;
  const isEditing = addressId != null;

  const { data: addresses = [], isLoading, isError, refetch } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const { data: selectedArea } = useSelectedDeliveryArea();
  const setSelectedAddressId = useCheckoutStore(
    state => state.setSelectedAddressId,
  );

  const existingAddress = addresses.find(a => a.address_id === addressId);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSubmit = useCallback(
    (input: AddressInput, setAsDefault: boolean) => {
      const onError = (error: unknown) => {
        console.log('🚀 ~ AddEditAddressScreen ~ save error:', error);
        // The AxiosError stack hides the server's reason - log the body.
        console.log(
          '🚀 ~ AddEditAddressScreen ~ save error body:',
          (error as { response?: { data?: unknown } })?.response?.data,
        );
        // The backend's own reason (e.g. "Selected location is outside
        // the delivery area") beats a generic message.
        Alert.alert('Could not save address', getErrorMessage(error));
      };

      if (existingAddress) {
        updateAddress.mutate(
          { id: existingAddress.address_id, patch: input },
          {
            onSuccess: () => {
              if (setAsDefault) {
                setDefaultAddress.mutate(existingAddress.address_id);
              }
              navigation.goBack();
            },
            onError,
          },
        );
      } else {
        createAddress.mutate(
          { ...input, is_default: setAsDefault },
          {
            onSuccess: created => {
              // A just-added address is what the shopper wants to use
              // next (e.g. when adding from checkout).
              setSelectedAddressId(created.address_id);
              navigation.goBack();
            },
            onError,
          },
        );
      }
    },
    [
      existingAddress,
      createAddress,
      updateAddress,
      setDefaultAddress,
      setSelectedAddressId,
      navigation,
    ],
  );

  const submitting = createAddress.isPending || updateAddress.isPending;
  // Only an EDIT needs the list loaded first (to prefill the form) - "add
  // new" can render immediately with an empty form regardless of whether
  // the address list has finished loading.
  const blockedOnLoad = isEditing && isLoading;
  const blockedOnError = isEditing && isError;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header
        title={isEditing ? 'Edit Address' : 'Add Address'}
        onBackPress={handleGoBack}
        style={styles.header}
      />

      {blockedOnLoad ? (
        <Loader fullscreen />
      ) : blockedOnError ? (
        <ErrorView title="Couldn't load this address" onRetry={refetch} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AddressForm
            deliveryArea={
              selectedArea
                ? {
                    id: selectedArea.id,
                    name: selectedArea.name,
                    pincode: selectedArea.pincode,
                  }
                : null
            }
            onChangeArea={() => navigation.navigate('SelectLocation')}
            defaultName={[profile?.user.first_name, profile?.user.last_name]
              .filter(Boolean)
              .join(' ')}
            defaultMobile={profile?.user.mobile_number
              ?.replace(/\D/g, '')
              .replace(/^(?:91)(?=\d{10}$)/, '')}
            selectedCoordinates={route.params?.selectedCoordinates}
            onChooseLocation={coordinates =>
              navigation.navigate('AddressLocation', {
                initialCoordinates: coordinates ?? undefined,
                addressId,
              })
            }
            initialAddress={existingAddress}
            submitLabel={isEditing ? 'Save Changes' : 'Add Address'}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});
