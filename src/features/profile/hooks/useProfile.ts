import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { useProfileStore } from '@/store/profileStore';

import { getProfileApi, type UserProfile } from '../api/profileApi';

/**
 * GET /api/v1/users/me/ - a background sync, not the source of truth the
 * screens render from. There's no reachable backend yet, so `retry: false`
 * avoids hammering a call that will keep failing, and nothing here
 * surfaces a loading/error state to the UI - the local `profileStore`
 * (seeded with demo data) is what Profile/Edit Profile actually read from.
 * When this *does* succeed against a real backend, the fetched name is
 * synced into that store, so callers see it update without any wiring
 * change on their end.
 */
export const useProfile = () => {
  const updateProfile = useProfileStore(state => state.updateProfile);

  const query = useQuery<UserProfile, Error>({
    queryKey: QUERY_KEYS.USER.profile(),
    queryFn: getProfileApi,
    retry: false,
  });

  useEffect(() => {
    if (!query.data) return;
    updateProfile({
      first_name: query.data.first_name,
      last_name: query.data.last_name,
    });
  }, [query.data, updateProfile]);

  return query;
};
