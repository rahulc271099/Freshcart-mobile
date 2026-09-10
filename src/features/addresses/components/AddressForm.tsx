import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, TextInput } from '@/components';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import type {
  Address,
  AddressInput,
  AddressLabel,
} from '../types/address.types';

const LABELS: AddressLabel[] = ['Home', 'Work', 'Other'];

interface AddressFormProps {
  /** Present when editing an existing address - prefills the form and
   * hides the "set as default" toggle if it's already the default. */
  initialAddress?: Address;
  submitLabel: string;
  onSubmit: (input: AddressInput, setAsDefault: boolean) => void;
}

export function AddressForm({
  initialAddress,
  submitLabel,
  onSubmit,
}: AddressFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [label, setLabel] = useState<AddressLabel>(
    initialAddress?.label ?? 'Home',
  );
  const [addressLine1, setAddressLine1] = useState(
    initialAddress?.address_line_1 ?? '',
  );
  const [addressLine2, setAddressLine2] = useState(
    initialAddress?.address_line_2 ?? '',
  );
  const [city, setCity] = useState(initialAddress?.city ?? '');
  const [state, setState] = useState(initialAddress?.state ?? '');
  const [pincode, setPincode] = useState(initialAddress?.pincode ?? '');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const alreadyDefault = initialAddress?.is_default === true;

  const handleSubmit = () => {
    if (!addressLine1.trim() || !city.trim() || !pincode.trim()) {
      setError('Address, city and pincode are required.');
      return;
    }
    setError(undefined);
    onSubmit(
      {
        label,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      setAsDefault,
    );
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>Address type</Text>
      <View style={styles.labelRow}>
        {LABELS.map(l => (
          <Pressable
            key={l}
            style={[styles.labelChip, label === l && styles.labelChipActive]}
            onPress={() => setLabel(l)}
          >
            <Text
              style={[
                styles.labelChipText,
                label === l && styles.labelChipTextActive,
              ]}
            >
              {l}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        label="Address line 1"
        value={addressLine1}
        onChangeText={setAddressLine1}
        placeholder="House no., building, street"
        containerStyle={styles.field}
      />
      <TextInput
        label="Address line 2 (optional)"
        value={addressLine2}
        onChangeText={setAddressLine2}
        placeholder="Landmark, area"
        containerStyle={styles.field}
      />
      <TextInput
        label="City"
        value={city}
        onChangeText={setCity}
        placeholder="City"
        containerStyle={styles.field}
      />
      <TextInput
        label="State"
        value={state}
        onChangeText={setState}
        placeholder="State"
        containerStyle={styles.field}
      />
      <TextInput
        label="Pincode"
        value={pincode}
        onChangeText={setPincode}
        placeholder="Pincode"
        keyboardType="number-pad"
        error={error}
        containerStyle={styles.field}
      />

      {!alreadyDefault && (
        <View style={styles.defaultRow}>
          <Text style={styles.defaultRowText}>Set as default address</Text>
          <Switch
            value={setAsDefault}
            onValueChange={setSetAsDefault}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      )}

      <Button
        title={submitLabel}
        onPress={handleSubmit}
        fullWidth
        style={styles.submitBtn}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fieldLabel: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    labelChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.background,
    },
    labelChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    labelChipText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    labelChipTextActive: {
      color: colors.textInverse,
    },
    field: {
      marginBottom: spacing.md,
    },
    defaultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    defaultRowText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
    },
    submitBtn: {
      marginTop: spacing.sm,
    },
  });
}
