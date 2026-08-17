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

export function getCurrentPosition(): Promise<GeolocationResponse> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });
  });
}
