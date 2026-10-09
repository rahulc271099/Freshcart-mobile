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
const BASE_URL = Config.API_BASE_URL ?? '';

const API_CONFIG = {
  BASE_URL,
  /**
   * `BASE_URL` with its trailing API-version segment removed (e.g.
   * `https://host/api/v1` -> `https://host/api`). A few public endpoints -
   * the customer home-content ones (`/api/customer/home/banners`, ...) -
   * live directly under `/api/`, NOT under `/api/v1/` like everything
   * else, so they can't be reached with a plain relative path off
   * `BASE_URL`. See `services/api/apiConfig.ts`'s `HOME` block.
   */
  ROOT_URL: BASE_URL.replace(/\/v\d+\/?$/, ''),
  APP_VERSION: '0.1',
  USER_AGENT: 'mobile',
} as const;

export default API_CONFIG;
