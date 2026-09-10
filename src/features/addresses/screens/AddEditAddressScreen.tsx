import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { useAddressStore } from '@/store/addressStore';
import { spacing, useTheme } from '@/theme';
import { AddressForm } from '../components/AddressForm';
import type { AddressInput } from '../types/address.types';

export function AddEditAddressScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'AddEditAddress'>>();
  const addressId = route.params?.addressId;

  const addresses = useAddressStore(state => state.addresses);
  const addAddress = useAddressStore(state => state.addAddress);
  const updateAddress = useAddressStore(state => state.updateAddress);
  const setDefaultAddress = useAddressStore(state => state.setDefaultAddress);

  const existingAddress = addresses.find(a => a.id === addressId);
  const isEditing = existingAddress != null;

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSubmit = useCallback(
    (input: AddressInput, setAsDefault: boolean) => {
      if (existingAddress) {
        updateAddress(existingAddress.id, input);
        if (setAsDefault) setDefaultAddress(existingAddress.id);
      } else {
        addAddress(input);
        // `addAddress` only auto-defaults the very first address on file
        // (see addressStore's own comment) - for every address after that,
        // "set as default" has to be applied explicitly. The newly added
        // address is always the last item in the array.
        if (setAsDefault) {
          const latest = useAddressStore.getState().addresses.at(-1);
          if (latest) setDefaultAddress(latest.id);
        }
      }
      navigation.goBack();
    },
    [existingAddress, addAddress, updateAddress, setDefaultAddress, navigation],
  );

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AddressForm
          initialAddress={existingAddress}
          submitLabel={isEditing ? 'Save Changes' : 'Add Address'}
          onSubmit={handleSubmit}
        />
      </ScrollView>
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
