import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { RecentLocation } from '@/features/location/types/location.types';
import { mmkvStorage } from '../services/storage/mmkv';

const MAX_RECENT = 5;

/**
 * On-device "Recently searched" list for the Select Your Location screen.
 * The chosen delivery area itself lives on the server (see
 * `useSelectedDeliveryArea`) - this only remembers past picks for one-tap
 * reuse, the way Instamart does.
 */
type LocationState = {
  recent: RecentLocation[];
  addRecent: (location: RecentLocation) => void;
  removeRecent: (pincode: string) => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    set => ({
      recent: [],
      // Most recent first, one entry per pincode.
      addRecent: location =>
        set(state => ({
          recent: [
            location,
            ...state.recent.filter(item => item.pincode !== location.pincode),
          ].slice(0, MAX_RECENT),
        })),
      removeRecent: pincode =>
        set(state => ({
          recent: state.recent.filter(item => item.pincode !== pincode),
        })),
    }),
    {
      name: 'freshcart-location',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
