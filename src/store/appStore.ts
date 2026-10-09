import { create } from 'zustand';

/**
 * App-level UI/session state that doesn't belong to any one feature and
 * doesn't need to persist across restarts (use authStore/cartStore for
 * anything that does).
 */
type AppState = {
  isBootstrapped: boolean;
  setBootstrapped: (value: boolean) => void;
  /** True once a delivery area was saved in this session - lets the
   * location gate (`MainNavigator`) open straight away without waiting on
   * a cache round-trip. Reset when the signed-in navigator unmounts. */
  locationConfirmed: boolean;
  setLocationConfirmed: (value: boolean) => void;
};

export const useAppStore = create<AppState>(set => ({
  isBootstrapped: false,
  setBootstrapped: (value: boolean) => set({ isBootstrapped: value }),
  locationConfirmed: false,
  setLocationConfirmed: (value: boolean) => set({ locationConfirmed: value }),
}));
