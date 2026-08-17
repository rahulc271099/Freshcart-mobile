import Config from 'react-native-config';

/**
 * Environment / configuration values needed by the JS layer.
 *
 * Sourced from the root `.env` file via `react-native-config` — see
 * `.env.example` for the expected keys. Copy it to `.env` locally and fill
 * in real values; `.env` is gitignored and must never be committed.
 *
 * MAPS_API_KEY is deliberately NOT here — it's Android-native-only and
 * continues to be read from `android/local.properties` via
 * `android/app/build.gradle`, since the JS layer never needs it directly
 * (iOS uses Apple Maps, which needs no key).
 */
export const env = {
  RAZORPAY_KEY_ID: Config.RAZORPAY_KEY_ID ?? '',
} as const;
