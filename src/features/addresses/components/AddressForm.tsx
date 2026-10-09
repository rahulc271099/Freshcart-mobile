import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Briefcase, Check, Crosshair, Home, MapPin } from 'lucide-react-native';

import { Button, TextInput } from '@/components';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import { type PinnedCoordinates } from '../utils/pinCurrentLocation';
import type {
  Address,
  AddressInput,
  AddressType,
} from '../types/address.types';

/** Matches `AddressWriteSerializer.contact_mobile`'s regex exactly - a
 * 10-digit Indian mobile number starting 6-9. */
const PHONE_RE = /^[6-9]\d{9}$/;

const ADDRESS_TYPES: {
  value: AddressType;
  label: string;
  icon: typeof Home;
}[] = [
  { value: 'HOME', label: 'Home', icon: Home },
  { value: 'WORK', label: 'Work', icon: Briefcase },
  { value: 'OTHER', label: 'Other', icon: MapPin },
];

/** The delivery area the address will be validated against - the
 * shopper's saved area (see `useSelectedDeliveryArea`). */
export interface AddressFormArea {
  id: number;
  name: string;
  pincode: string;
}

interface AddressFormProps {
  /** The shopper's currently selected delivery area. A NEW address is
   * always created inside it (the backend validates the postal code and
   * coordinates against one area). */
  deliveryArea: AddressFormArea | null;
  /** Opens the area picker, for when the address belongs elsewhere. */
  onChangeArea?: () => void;
  /** Present when editing an existing address - prefills the form and
   * hides the "set as default" toggle if it's already the default. */
  initialAddress?: Address;
  submitLabel: string;
  onSubmit: (input: AddressInput, setAsDefault: boolean) => void;
  submitting?: boolean;
  defaultName?: string;
  defaultMobile?: string;
  selectedCoordinates?: PinnedCoordinates;
  onChooseLocation: (coordinates: PinnedCoordinates | null) => void;
}

export function AddressForm({
  deliveryArea,
  onChangeArea,
  initialAddress,
  submitLabel,
  onSubmit,
  submitting = false,
  defaultName = '',
  defaultMobile = '',
  selectedCoordinates,
  onChooseLocation,
}: AddressFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [addressType, setAddressType] = useState<AddressType>(
    initialAddress?.address_type ?? 'HOME',
  );
  const [contactName, setContactName] = useState(
    initialAddress?.contact_name ?? defaultName,
  );
  const [contactMobile, setContactMobile] = useState(
    initialAddress?.contact_mobile ?? defaultMobile,
  );
  const [addressLine1, setAddressLine1] = useState(
    initialAddress?.address_line1 ?? '',
  );
  const [addressLine2, setAddressLine2] = useState(
    initialAddress?.address_line2 ?? '',
  );
  const [landmark, setLandmark] = useState(initialAddress?.landmark ?? '');
  const [city, setCity] = useState(initialAddress?.city ?? '');

  // Delivery area + pincode: an existing address keeps the area it was
  // saved against; a new (or legacy, area-less) one uses the selected
  // area. Not editable here - changing area is the picker's job.
  const areaId = initialAddress?.deliveryAreaId ?? deliveryArea?.id ?? null;
  const postalCode =
    initialAddress?.deliveryAreaId != null
      ? initialAddress.postal_code
      : deliveryArea?.pincode ?? '';
  const areaName =
    deliveryArea && deliveryArea.id === areaId ? deliveryArea.name : null;
  const [coords, setCoords] = useState<PinnedCoordinates | null>(
    initialAddress?.latitude != null && initialAddress?.longitude != null
      ? {
          latitude: initialAddress.latitude,
          longitude: initialAddress.longitude,
        }
      : null,
  );

  const [deliveryInstructions, setDeliveryInstructions] = useState(
    initialAddress?.delivery_instructions ?? '',
  );
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const alreadyDefault = initialAddress?.is_default === true;

  // Late profile responses must never replace a recipient the shopper typed.
  const nameEdited = useRef(false);
  const mobileEdited = useRef(false);
  useEffect(() => {
    if (!initialAddress && !nameEdited.current) setContactName(defaultName);
  }, [defaultName, initialAddress]);
  useEffect(() => {
    if (!initialAddress && !mobileEdited.current)
      setContactMobile(defaultMobile);
  }, [defaultMobile, initialAddress]);
  useEffect(() => {
    if (selectedCoordinates) {
      setCoords(selectedCoordinates);
      setErrors(previous => ({ ...previous, location: '' }));
    }
  }, [selectedCoordinates]);

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    if (!contactName.trim()) {
      nextErrors.contactName = 'Contact name is required.';
    }
    if (!PHONE_RE.test(contactMobile.trim())) {
      nextErrors.contactMobile = 'Enter a valid 10-digit mobile number.';
    }
    if (!addressLine1.trim()) {
      nextErrors.addressLine1 = 'Address line 1 is required.';
    }
    if (!city.trim()) {
      nextErrors.city = 'City is required.';
    }
    if (!coords) {
      nextErrors.location = 'Choose and confirm your delivery location.';
    }
    if (areaId == null || !postalCode) {
      nextErrors.area = 'Choose your delivery area first.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || areaId == null) {
      return;
    }

    onSubmit(
      {
        address_type: addressType,
        contact_name: contactName.trim(),
        contact_mobile: contactMobile.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        district: 'Calicut',
        state: 'Kerala',
        postal_code: postalCode,
        delivery_area_id: areaId,
        ...(coords
          ? { latitude: coords.latitude, longitude: coords.longitude }
          : {}),
        delivery_instructions: deliveryInstructions.trim() || undefined,
      },
      setAsDefault,
    );
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>Address type</Text>
      <View style={styles.labelRow}>
        {ADDRESS_TYPES.map(({ value, label, icon: Icon }) => (
          <Pressable
            key={value}
            style={[
              styles.labelChip,
              addressType === value && styles.labelChipActive,
            ]}
            onPress={() => setAddressType(value)}
          >
            <Icon
              color={
                addressType === value ? colors.textInverse : colors.textPrimary
              }
              size={14}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.labelChipText,
                addressType === value && styles.labelChipTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        label="Contact name"
        value={contactName}
        onChangeText={value => {
          nameEdited.current = true;
          setContactName(value);
        }}
        placeholder="Who should we hand this to?"
        error={errors.contactName}
        containerStyle={styles.field}
      />
      <TextInput
        label="Contact mobile"
        value={contactMobile}
        onChangeText={value => {
          mobileEdited.current = true;
          setContactMobile(value);
        }}
        placeholder="10-digit mobile number"
        keyboardType="number-pad"
        maxLength={10}
        error={errors.contactMobile}
        containerStyle={styles.field}
      />
      <TextInput
        label="Address line 1"
        value={addressLine1}
        onChangeText={setAddressLine1}
        placeholder="House no., building, street"
        error={errors.addressLine1}
        containerStyle={styles.field}
      />
      <TextInput
        label="Address line 2 (optional)"
        value={addressLine2}
        onChangeText={setAddressLine2}
        placeholder="Area, locality"
        containerStyle={styles.field}
      />
      <TextInput
        label="Landmark (optional)"
        value={landmark}
        onChangeText={setLandmark}
        placeholder="Nearby landmark"
        containerStyle={styles.field}
      />
      <TextInput
        label="City"
        value={city}
        onChangeText={setCity}
        placeholder="City"
        error={errors.city}
        containerStyle={styles.field}
      />
      <Text style={styles.fieldLabel}>District and state</Text>
      <Text style={[styles.infoSub, styles.field]}>Calicut, Kerala</Text>
      {/* Delivery area - fixed to the selected area (see props). */}
      <Text style={styles.fieldLabel}>Delivery area</Text>
      <View
        style={[styles.infoCard, errors.area ? styles.infoCardError : null]}
      >
        <MapPin color={colors.primary} size={18} />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle} numberOfLines={1}>
            {areaId != null
              ? `${areaName ? `${areaName} · ` : ''}${postalCode}`
              : 'No delivery area selected'}
          </Text>
          <Text style={styles.infoSub}>
            Addresses are saved inside your delivery area.
          </Text>
        </View>
        {onChangeArea ? (
          <Pressable
            onPress={onChangeArea}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Change delivery area"
          >
            <Text style={styles.link}>Change</Text>
          </Pressable>
        ) : null}
      </View>
      {errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}

      {/* Pinned location - optional. */}
      <Text style={[styles.fieldLabel, styles.sectionGap]}>
        Delivery location
      </Text>
      <View
        style={[styles.infoCard, errors.location ? styles.infoCardError : null]}
      >
        {coords ? (
          <Check color={colors.success} size={18} />
        ) : (
          <Crosshair color={colors.textSecondary} size={18} />
        )}
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>
            {coords ? 'Location selected' : 'Choose your delivery spot'}
          </Text>
          <Text style={styles.infoSub}>
            {coords
              ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
              : 'Move the map to mark your building or entrance.'}
          </Text>
        </View>
        <Pressable
          onPress={() => onChooseLocation(coords)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            coords
              ? 'Change delivery location on map'
              : 'Choose delivery location on map'
          }
          style={styles.mapAction}
        >
          <Text style={styles.link}>{coords ? 'Change' : 'Choose on map'}</Text>
        </Pressable>
      </View>
      {errors.location ? (
        <Text style={styles.errorText}>{errors.location}</Text>
      ) : null}
      <View style={styles.field} />

      <TextInput
        label="Delivery instructions (optional)"
        value={deliveryInstructions}
        onChangeText={setDeliveryInstructions}
        placeholder="Gate code, preferred drop-off, ..."
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
        loading={submitting}
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
    sectionGap: {
      marginTop: spacing.md,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    infoCardError: {
      borderColor: colors.error,
    },
    infoText: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    infoSub: {
      marginTop: 2,
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    link: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    mapAction: { minHeight: 44, justifyContent: 'center' },
    errorText: {
      marginTop: spacing.xs,
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.error,
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
