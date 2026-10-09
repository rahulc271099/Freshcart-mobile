export interface Session {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export interface ApiError {
  message?: string;
  data?: ApiErrorResponse;
  error?: unknown;
}

/**
 * Envelope shape the backend's `users` app wraps every response in (see
 * `core/api/responses.py`'s `success_response()`/`created_response()`
 * helpers, used by auth/profile/addresses/devices/preferences/wishlist
 * views). The `catalogue` and `orders` apps do NOT use this envelope -
 * their endpoints return the raw payload directly, so do not wrap those
 * response types in this.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}