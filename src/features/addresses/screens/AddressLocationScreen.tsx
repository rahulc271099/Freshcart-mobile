import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { type Region } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';

import { Button, Header, Loader } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { fonts, spacing, useTheme, type ThemeColors } from '@/theme';
import {
  LocationPinError,
  pinCurrentLocation,
  type PinnedCoordinates,
} from '../utils/pinCurrentLocation';

const CALICUT = { latitude: 11.2588, longitude: 75.7804 };
const regionFor = (coordinates: PinnedCoordinates): Region => ({
  ...coordinates,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
});

export function AddressLocationScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'AddressLocation'>>();
  const initial = route.params.initialCoordinates;
  const map = useRef<MapView>(null);
  const coordinate = useRef<PinnedCoordinates>(initial ?? CALICUT);
  const alive = useRef(true);
  const interacted = useRef(false);
  const [ready, setReady] = useState(false);
  const [moving, setMoving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = async (automatic = false) => {
    setLocating(true);
    setError(null);
    try {
      const position = await pinCurrentLocation();
      if (!alive.current || (automatic && interacted.current)) return;
      coordinate.current = position;
      map.current?.animateToRegion(regionFor(position), 300);
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof LocationPinError
            ? `${cause.message} You can still choose a spot on the map.`
            : 'Could not get your location. Move the map to choose a spot.',
        );
    } finally {
      if (alive.current) setLocating(false);
    }
  };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header
        title="Choose delivery location"
        onBackPress={() => navigation.goBack()}
        style={styles.header}
      />
      <View style={styles.mapContainer}>
        <MapView
          ref={map}
          style={StyleSheet.absoluteFill}
          initialRegion={regionFor(coordinate.current)}
          rotateEnabled={false}
          pitchEnabled={false}
          onMapReady={() => {
            setReady(true);
            if (!initial) locate(true);
          }}
          onPanDrag={() => {
            interacted.current = true;
          }}
          onRegionChange={(_, details) => {
            if (details.isGesture) interacted.current = true;
            setMoving(true);
          }}
          onRegionChangeComplete={region => {
            coordinate.current = {
              latitude: region.latitude,
              longitude: region.longitude,
            };
            setMoving(false);
          }}
        />
        <View pointerEvents="none" style={styles.pin}>
          <MapPin
            size={40}
            color={colors.primary}
            fill={colors.background}
            strokeWidth={2.5}
          />
        </View>
        {!ready && (
          <View style={styles.loading}>
            <Loader />
            <Text style={styles.body}>Loading map…</Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.title}>Place the pin at your entrance</Text>
        <Text style={styles.body}>
          Move and zoom the map to choose your delivery spot. Availability is
          checked when you save the address.
        </Text>
        {error && (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        )}
        <Button
          title="Use my current location"
          variant="outline"
          loading={locating}
          disabled={!ready || moving}
          onPress={() => {
            interacted.current = true;
            locate();
          }}
          fullWidth
        />
        <Button
          title="Confirm location"
          disabled={!ready || moving || locating}
          onPress={() =>
            navigation.popTo(
              'AddEditAddress',
              {
                addressId: route.params.addressId,
                selectedCoordinates: { ...coordinate.current },
              },
              { merge: true },
            )
          }
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.md },
    mapContainer: { flex: 1, minHeight: 160 },
    // The icon's tip, rather than its centre, marks the map's centre coordinate.
    pin: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -20,
      marginTop: -40,
    },
    loading: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    footer: { padding: spacing.md, gap: spacing.sm },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 17,
      color: colors.textPrimary,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    error: { fontFamily: fonts.regular, fontSize: 13, color: colors.error },
  });
}
