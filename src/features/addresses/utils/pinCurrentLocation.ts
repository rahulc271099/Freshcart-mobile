import {
  getCurrentPosition,
  requestLocationPermission,
} from '@/services/maps/location';

/** A device coordinate used to "pin" an address. */
export interface PinnedCoordinates {
  latitude: number;
  longitude: number;
}

/** Thrown with a message that is safe to show the shopper as-is. */
export class LocationPinError extends Error {}

/**
 * Reads the device's GPS position for an address pin. The backend requires
 * real coordinates on every saved address (`validate_coordinates` in
 * `DeliveryAreaService` rejects a missing/invalid one, and re-checks them
 * against the delivery area's radius when it has one), and has no
 * geocoding of its own - so the coordinate has to come from the device.
 *
 * Every failure mode is mapped to a plain-language message: denied
 * permission, GPS off/unavailable, and timeout read very differently to
 * the shopper and need different next steps.
 */
export async function pinCurrentLocation(): Promise<PinnedCoordinates> {
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new LocationPinError(
      'Location permission is needed to pin your delivery spot. Allow it in your phone settings and try again.',
    );
  }
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new LocationPinError('Could not read a valid location. Try again.');
    }
    return { latitude, longitude };
  } catch (error) {
    if (error instanceof LocationPinError) throw error;
    // @react-native-community/geolocation: 1 denied, 2 unavailable, 3 timeout.
    const code = (error as { code?: number } | null)?.code;
    if (code === 1) {
      throw new LocationPinError(
        'Location permission is off. Allow it in your phone settings and try again.',
      );
    }
    if (code === 2) {
      throw new LocationPinError(
        'Your location is unavailable. Turn on GPS and try again.',
      );
    }
    if (code === 3) {
      throw new LocationPinError(
        'Finding your location took too long. Move to an open area and try again.',
      );
    }
    console.error('[pinCurrentLocation] unexpected failure', error);
    throw new LocationPinError('Could not get your location. Try again.');
  }
}
