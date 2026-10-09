import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, ChevronRight, Clock, MapPin, Search, X } from 'lucide-react-native';

import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { icons } from '@/constants/icons';
import { getErrorMessage } from '@/features/checkout/utils/getErrorMessage';
import { useLocationStore } from '@/store/locationStore';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import {
  useCheckPincode,
  useSelectDeliveryArea,
  useSelectedDeliveryArea,
} from '../hooks/useDeliveryLocation';
import type { DeliveryArea, RecentLocation } from '../types/location.types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SelectLocation'>;

const PINCODE_LENGTH = 6;

/** What the last pincode lookup said - kept with the pincode it was for so
 * a slow response can never be shown against a different pincode. */
type LookupResult =
  | { pincode: string; status: 'available'; area: DeliveryArea }
  | { pincode: string; status: 'unavailable' }
  | { pincode: string; status: 'error'; message: string };

/**
 * "Select Your Location" - pick a delivery area by pincode (Instamart
 * pattern: search field, then tap a result or a recent pick). The backend
 * only offers a pincode lookup (no area list, no geocoding), so search is
 * pincode-based; the saved choice is stored server-side via `select-area`
 * and past picks are remembered on-device under "Recently searched".
 */
export function SelectLocationScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  // First-run gate: nowhere to go back to, and the screen is replaced by
  // the dashboard as soon as the area is saved.
  // Shared by two routes: `SelectLocation` (pushed from Home) and
  // `LocationGate` (first run), hence the loose params read.
  const route = useRoute<RouteProp<MainStackParamList, 'LocationGate'>>();
  const isRequired = route.params?.required === true;

  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  // Guards against out-of-order responses while the shopper keeps typing.
  const latestPincode = useRef('');

  const { data: selectedArea } = useSelectedDeliveryArea();
  const checkPincode = useCheckPincode();
  const selectArea = useSelectDeliveryArea();
  const recent = useLocationStore(state => state.recent);
  const addRecent = useLocationStore(state => state.addRecent);
  const removeRecent = useLocationStore(state => state.removeRecent);

  const handleChangeText = useCallback(
    (text: string) => {
      // Digits only - the backend rejects anything but 6 digits anyway.
      const digits = text.replace(/\D/g, '').slice(0, PINCODE_LENGTH);
      setPincode(digits);
      setSelectError(null);
      latestPincode.current = digits;
      setResult(null);
      if (digits.length !== PINCODE_LENGTH) return;

      checkPincode.mutate(digits, {
        onSuccess: response => {
          if (latestPincode.current !== digits) return;
          if (response.deliveryAvailable && response.deliveryArea) {
            setResult({
              pincode: digits,
              status: 'available',
              area: response.deliveryArea,
            });
          } else {
            setResult({ pincode: digits, status: 'unavailable' });
          }
        },
        onError: error => {
          if (latestPincode.current !== digits) return;
          console.error('[SelectLocation] check-pincode failed', error);
          setResult({
            pincode: digits,
            status: 'error',
            message: getErrorMessage(error),
          });
        },
      });
    },
    [checkPincode],
  );

  const handleClear = useCallback(() => handleChangeText(''), [handleChangeText]);

  /** Saves the choice on the server, remembers it locally, then leaves. */
  const handleSelect = useCallback(
    (location: RecentLocation) => {
      setSelectError(null);
      selectArea.mutate(
        { deliveryAreaId: location.areaId, pincode: location.pincode },
        {
          onSuccess: () => {
            addRecent(location);
            if (!isRequired) navigation.goBack();
          },
          onError: error => {
            console.error('[SelectLocation] select-area failed', error);
            // A remembered area that's no longer serviceable shouldn't
            // keep being offered.
            removeRecent(location.pincode);
            setSelectError(getErrorMessage(error));
          },
        },
      );
    },
    [addRecent, isRequired, navigation, removeRecent, selectArea],
  );

  const isChecking = checkPincode.isPending;
  const isSaving = selectArea.isPending;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {isRequired ? null : (
          <Pressable
            onPress={navigation.goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <icons.back color={colors.textPrimary} size={24} strokeWidth={2} />
          </Pressable>
        )}
        <Text style={styles.title} accessibilityRole="header">
          Select Your Location
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchField}>
          <Search color={colors.textSecondary} size={18} />
          <TextInput
            style={styles.searchInput}
            value={pincode}
            onChangeText={handleChangeText}
            placeholder="Search by pincode"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={PINCODE_LENGTH}
            autoFocus
            accessibilityLabel="Pincode"
          />
          {isChecking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : pincode.length > 0 ? (
            <Pressable
              onPress={handleClear}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear pincode"
            >
              <X color={colors.textSecondary} size={18} />
            </Pressable>
          ) : null}
        </View>

        {pincode.length > 0 && pincode.length < PINCODE_LENGTH ? (
          <Text style={styles.hint}>Enter all 6 digits of your pincode</Text>
        ) : null}

        {result?.status === 'available' ? (
          <LocationRow
            icon={<MapPin color={colors.primary} size={18} />}
            title={result.area.name}
            subtitle={formatSubtitle(result.area.pincode, result.area.estimatedDeliveryMinutes)}
            onPress={() =>
              handleSelect({
                areaId: result.area.id,
                areaName: result.area.name,
                pincode: result.area.pincode,
              })
            }
            disabled={isSaving}
            colors={colors}
          />
        ) : null}

        {result?.status === 'unavailable' ? (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <Text style={styles.noticeTitle}>Sorry! We don't deliver here</Text>
            <Text style={styles.noticeBody}>
              We're not available at {result.pincode} yet. Please try another
              pincode.
            </Text>
          </View>
        ) : null}

        {result?.status === 'error' ? (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <Text style={styles.noticeTitle}>Couldn't check this pincode</Text>
            <Text style={styles.noticeBody}>{result.message}</Text>
          </View>
        ) : null}

        {selectError ? (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <Text style={styles.noticeTitle}>Couldn't save this location</Text>
            <Text style={styles.noticeBody}>{selectError}</Text>
          </View>
        ) : null}

        {recent.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>RECENTLY SEARCHED</Text>
            {recent.map(location => {
              const isSelected = selectedArea?.pincode === location.pincode;
              return (
                <LocationRow
                  key={location.pincode}
                  icon={<Clock color={colors.textSecondary} size={18} />}
                  title={location.areaName}
                  subtitle={`Pincode ${location.pincode}`}
                  selected={isSelected}
                  onPress={() => handleSelect(location)}
                  disabled={isSaving}
                  colors={colors}
                />
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** "673639 · Delivers in ~11 mins" - minutes only when the area has them. */
function formatSubtitle(pincode: string, minutes: number | null): string {
  return minutes != null
    ? `Pincode ${pincode} · Delivers in ~${minutes} mins`
    : `Pincode ${pincode}`;
}

interface LocationRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  colors: ThemeColors;
}

/** White rounded card row: icon, bold name, grey detail, trailing marker. */
function LocationRow({
  icon,
  title,
  subtitle,
  selected = false,
  disabled = false,
  onPress,
  colors,
}: LocationRowProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {selected ? (
        <Check color={colors.primary} size={18} />
      ) : (
        <ChevronRight color={colors.textSecondary} size={18} />
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    title: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    searchField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
      paddingVertical: spacing.sm,
    },
    hint: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      paddingHorizontal: spacing.xs,
    },
    sectionLabel: {
      marginTop: spacing.md,
      fontSize: 12,
      fontFamily: fonts.semiBold,
      letterSpacing: 0.8,
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowPressed: {
      opacity: 0.7,
    },
    rowIcon: {
      width: 20,
      alignItems: 'center',
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    rowSubtitle: {
      marginTop: 2,
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    notice: {
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    noticeTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    noticeBody: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
