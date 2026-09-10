import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';

/**
 * Matches the confirmed contract:
 *   GET /api/v1/users/me/
 *
 * The full response shape beyond `first_name`/`last_name` isn't confirmed
 * yet, so this is documented as the best-known shape, not a guaranteed
 * complete one.
 */
export type UserProfile = {
  first_name: string;
  last_name: string;
  mobile_number?: string;
  email?: string;
};

/**
 * Logs both the outgoing request and the outcome (success OR failure).
 * This matters here specifically: without a log on the failure path, a
 * 401/404/timeout/unreachable-host error makes this look like it's "not
 * calling" at all, when it actually fired and rejected before ever
 * reaching a success log - `retry: false` + no error UI in `useProfile`
 * means that failure is otherwise completely invisible.
 */
export const getProfileApi = async (): Promise<UserProfile> => {
  console.log('🚀 ~ getProfileApi ~ requesting:', API_CONFIG.USER.PROFILE);
  try {
    const response = await api.get<UserProfile>(API_CONFIG.USER.PROFILE);
    console.log('🚀 ~ getProfileApi ~ response.data:', response.data);
    return response.data;
  } catch (error) {
    console.log('🚀 ~ getProfileApi ~ error:', error);
    throw error;
  }
};

/**
 * Matches the confirmed contract exactly:
 *   PATCH /api/v1/users/me/profile/   { "first_name": "John", "last_name": "Doe" }
 *
 * Deliberately excludes mobile number/email - not part of this confirmed
 * payload shape.
 */
export type UpdateProfilePayload = {
  first_name: string;
  last_name: string;
};

export const updateProfileApi = async (
  payload: UpdateProfilePayload,
): Promise<UserProfile> => {
  console.log(
    '🚀 ~ updateProfileApi ~ requesting:',
    API_CONFIG.USER.UPDATE_PROFILE,
    payload,
  );
  try {
    const response = await api.patch<UserProfile>(
      API_CONFIG.USER.UPDATE_PROFILE,
      payload,
    );
    console.log('🚀 ~ updateProfileApi ~ response.data:', response.data);
    return response.data;
  } catch (error) {
    console.log('🚀 ~ updateProfileApi ~ error:', error);
    throw error;
  }
};
