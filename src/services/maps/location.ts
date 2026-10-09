import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, {
  type GeolocationResponse,
} from '@react-native-community/geolocation';

/**
 * Location/address foundation. This only gets a device coordinate — it
 * does not resolve that coordinate to an address or decide delivery
 * serviceability. Per the project's maps architecture rule, the backend
 * is the authority on delivery-zone eligibility; the client only supplies
 * coordinates for the backend to validate.
 *
 * Address autocomplete (Places API) is deliberately not wired up here: it
 * needs no dedicated npm package (plain REST calls to the Places API from
 * a backend-facing service are enough), and doing so is `features/delivery`
 * / `features/addresses` business logic for a later step, not a
 * dependency-configuration concern.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS prompts automatically off the Info.plist usage description the
  // first time `getCurrentPosition` is called — nothing to request here.
  return true;
}

function readPosition(
  options: Parameters<typeof Geolocation.getCurrentPosition>[2],
): Promise<GeolocationResponse> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Two-stage read. A cold GPS fix indoors (or on an emulator with no
 * location set) routinely takes longer than any sane timeout, which is
 * what produced "finding your location took too long". So: try a precise
 * GPS fix briefly first, then fall back to the network/cell/wifi
 * position (or a recent cached one), which resolves in a second or two
 * and is plenty accurate for the delivery-area check.
 */
export async function getCurrentPosition(): Promise<GeolocationResponse> {
  try {
    return await readPosition({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000,
    });
  } catch (error) {
    // Permission denied won't be fixed by a retry - surface it as-is.
    if ((error as { code?: number } | null)?.code === 1) throw error;
    return readPosition({
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 10 * 60 * 1000,
    });
  }
}
