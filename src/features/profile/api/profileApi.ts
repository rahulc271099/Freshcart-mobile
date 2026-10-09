import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';
import type { ApiEnvelope } from '@/services/api/types';

/**
 * Matches `UserSerializer` on the backend exactly - the `user` key inside
 * `MyProfileSerializer`'s nested response (see `ProfileUser` below).
 */
export type ProfileUser = {
  user_id: string;
  user_code: string;
  mobile_number: string;
  email: string | null;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
  is_mobile_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

/**
 * Matches `MyProfileSerializer` on the backend exactly:
 *   GET/PATCH /api/v1/users/me/
 * returns this NESTED shape (not a flat user object), wrapped in the
 * standard `users`-app envelope - see `ApiEnvelope<T>` in
 * `services/api/types.ts`. `customer_profile`/`preferences` shapes aren't
 * confirmed in detail yet, so they're left as open records rather than
 * guessed.
 */
export type MyProfile = {
  user: ProfileUser;
  roles: string[];
  customer_profile: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
};

/**
 * @deprecated Kept only so any stray import of the old flat shape still
 * compiles. The real response is `MyProfile` (nested under `.user`) - use
 * that instead.
 */
export type UserProfile = ProfileUser;

/**
 * Logs both the outgoing request and the outcome (success OR failure).
 * This matters here specifically: without a log on the failure path, a
 * 401/404/timeout/unreachable-host error makes this look like it's "not
 * calling" at all, when it actually fired and rejected before ever
 * reaching a success log - `retry: false` + no error UI in `useProfile`
 * means that failure is otherwise completely invisible.
 */
export const getProfileApi = async (): Promise<MyProfile> => {
  console.log('🚀 ~ getProfileApi ~ requesting:', API_CONFIG.USER.PROFILE);
  try {
    const response = await api.get<ApiEnvelope<MyProfile>>(
      API_CONFIG.USER.PROFILE,
    );
    console.log('🚀 ~ getProfileApi ~ response.data:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('🚀 ~ getProfileApi ~ error:', error);
    throw error;
  }
};

/**
 * Matches the confirmed contract exactly:
 *   PATCH /api/v1/users/me/   { "first_name": "John", "last_name": "Doe" }
 *
 * Deliberately excludes mobile number/email - not part of this confirmed
 * payload shape. Previously pointed at `/users/me/profile/` (the
 * EXTENDED-profile endpoint, which doesn't accept first_name/last_name at
 * all and silently drops them) - fixed to hit the basic-info endpoint that
 * actually applies this payload.
 */
export type UpdateProfilePayload = {
  first_name: string;
  last_name: string;
};

export const updateProfileApi = async (
  payload: UpdateProfilePayload,
): Promise<MyProfile> => {
  console.log(
    '🚀 ~ updateProfileApi ~ requesting:',
    API_CONFIG.USER.PROFILE,
    payload,
  );
  try {
    const response = await api.patch<ApiEnvelope<MyProfile>>(
      API_CONFIG.USER.PROFILE,
      payload,
    );
    console.log('🚀 ~ updateProfileApi ~ response.data:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('🚀 ~ updateProfileApi ~ error:', error);
    throw error;
  }
};
