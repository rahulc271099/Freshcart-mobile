import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { useProfileStore } from '@/store/profileStore';

import { getProfileApi, type MyProfile } from '../api/profileApi';

/**
 * GET /api/v1/users/me/ - a background sync, not the source of truth the
 * screens render from. There's no reachable backend yet, so `retry: false`
 * avoids hammering a call that will keep failing, and nothing here
 * surfaces a loading/error state to the UI - the local `profileStore`
 * (seeded with demo data) is what Profile/Edit Profile actually read from.
 * When this *does* succeed against a real backend, the fetched name is
 * synced into that store, so callers see it update without any wiring
 * change on their end. Response is the NESTED `MyProfile` shape
 * ({user, roles, customer_profile, preferences}) - the name fields live
 * under `.user`, not at the top level.
 */
export const useProfile = () => {
  const updateProfile = useProfileStore(state => state.updateProfile);

  const query = useQuery<MyProfile, Error>({
    queryKey: QUERY_KEYS.USER.profile(),
    queryFn: getProfileApi,
    retry: false,
  });

  useEffect(() => {
    if (!query.data) return;
    updateProfile({
      first_name: query.data.user.first_name,
      last_name: query.data.user.last_name,
    });
  }, [query.data, updateProfile]);

  return query;
};
