import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '../services/storage/mmkv';

type ProfileState = {
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  updateProfile: (
    patch: Partial<
      Pick<ProfileState, 'first_name' | 'last_name' | 'mobile_number' | 'email'>
    >,
  ) => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    set => ({
      first_name: 'Rahul',
      last_name: 'C',
      mobile_number: '+91 98765 43210',
      email: 'rahul.c@example.com',
      updateProfile: patch => set(patch),
    }),
    {
      name: 'freshcart-profile',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
