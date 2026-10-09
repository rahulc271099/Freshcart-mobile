import axios from 'axios';

import API_CONFIG from '@/config/api';

import {
  createResponseErrorInterceptor,
  requestInterceptor,
} from './interceptors';
import { denormalizeMoney } from './moneyFields';

/**
 * The single configured Axios instance for the whole app. Feature API
 * modules (`features/<feature>/api/*Api.ts`) call methods on this instance
 * directly (`api.get(...)`, `api.post(...)`, ...) instead of going through
 * a hand-rolled method-switch wrapper — Axios already provides typed,
 * well-tested GET/POST/PUT/DELETE/PATCH methods, so there's nothing for a
 * wrapper to add here.
 */
export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(requestInterceptor, error =>
  Promise.reject(error),
);

api.interceptors.response.use(
  // Every response body passes through `denormalizeMoney` exactly once,
  // here - see that function's own comment for why this is necessary
  // (every money field in this API is a JSON STRING on the wire, not a
  // number) and why doing it centrally here is better than every feature
  // `*Api.ts` file remembering to convert its own money fields itself.
  response => {
    response.data = denormalizeMoney(response.data);
    return response;
  },
  createResponseErrorInterceptor(api),
);

export default api;
