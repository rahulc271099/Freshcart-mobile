import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin } from 'lucide-react-native';

import { Button, Header } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { useAddressStore } from '@/store/addressStore';
import { fonts, spacing, useTheme, type ThemeColors } from '@/theme';
import { AddressCard } from '../components/AddressCard';
import type { Address } from '../types/address.types';

export function AddressesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const addresses = useAddressStore(state => state.addresses);
  const removeAddress = useAddressStore(state => state.removeAddress);
  const setDefaultAddress = useAddressStore(state => state.setDefaultAddress);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleDelete = useCallback(
    (address: Address) => {
      Alert.alert(
        `Delete ${address.label} address?`,
        'This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeAddress(address.id),
          },
        ],
      );
    },
    [removeAddress],
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

      {addresses.length === 0 ? (
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
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              onEdit={() =>
                navigation.navigate('AddEditAddress', { addressId: item.id })
              }
              onDelete={() => handleDelete(item)}
              onSetDefault={() => setDefaultAddress(item.id)}
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
