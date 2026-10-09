import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { useAppStore } from '@/store/appStore';
import {
  checkPincodeApi,
  getSelectedDeliveryAreaApi,
  selectDeliveryAreaApi,
} from '../api/locationApi';
import type { DeliveryArea } from '../types/location.types';

const STALE_TIME_MS = 5 * 60 * 1000;

/** The shopper's saved delivery area (`null` = must pick one). */
export const useSelectedDeliveryArea = () =>
  useQuery<DeliveryArea | null, Error>({
    queryKey: QUERY_KEYS.DELIVERY.selected(),
    queryFn: getSelectedDeliveryAreaApi,
    staleTime: STALE_TIME_MS,
  });

/** Is this pincode serviceable? Public endpoint, so a mutation (one-off
 * lookup per typed pincode) rather than a cached query. */
export const useCheckPincode = () =>
  useMutation({ mutationFn: checkPincodeApi });

/** Saves the chosen area, then refreshes everything that depends on it. */
export const useSelectDeliveryArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: selectDeliveryAreaApi,
    onSuccess: area => {
      // Saved on the server - the location gate can open right now.
      useAppStore.getState().setLocationConfirmed(true);
      // The app's location gate (`MainNavigator`) reads this query and lets
      // the shopper through to the dashboard the moment it holds an area.
      // `setQueryData` silently ignores `undefined`, so if the response
      // ever lacks the area, re-read it from the server instead of
      // leaving the gate stuck on the stale `null`.
      if (area) {
        queryClient.setQueryData(QUERY_KEYS.DELIVERY.selected(), area);
      } else {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DELIVERY.selected(),
        });
      }
      // The delivery fee/quote is computed server-side from the saved area.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.all });
    },
  });
};
