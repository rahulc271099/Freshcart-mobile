import Config from 'react-native-config';

/**
 * API-level configuration: base URL and the client-identification headers
 * sent on every request.
 *
 * `BASE_URL` is read from the root `.env` file via `react-native-config`
 * (see `.env.example` for the expected keys). Copy `.env.example` to
 * `.env` locally and fill in a real value — `.env` is gitignored, same
 * convention already used for `android/local.properties` (Maps key) and
 * the Firebase config files.
 */
const API_CONFIG = {
  BASE_URL: Config.API_BASE_URL ?? '',
  APP_VERSION: '0.1',
  USER_AGENT: 'mobile',
} as const;

export default API_CONFIG;
