/**
 * Shapes of the delivery-area endpoints (`core/api/delivery_areas/views.py`
 * + `DeliveryAreaService`). These views are NOT wrapped in the `users`
 * envelope - they return `{ success, ... }` objects directly. Field names
 * are camelCase on the wire (the SQL aliases in `AREA_SELECT`).
 */
export interface DeliveryArea {
  id: number;
  name: string;
  /** Display only - the backend stays the authority for the real fee. */
  deliveryFee: number;
  minimumOrderAmount: number;
  estimatedDeliveryMinutes: number | null;
  /** The pincode this area was resolved from (added by `check()`). */
  pincode: string;
}

/** POST /customer/delivery/check-pincode/ - always HTTP 200; serviceability
 * is in `deliveryAvailable`, not the status code. */
export interface CheckPincodeResponse {
  success: boolean;
  deliveryAvailable: boolean;
  deliveryArea?: DeliveryArea;
  message: string;
}

/** A location the shopper picked before - kept on-device only (the backend
 * has no "recent searches"), re-validated by `select-area` when tapped. */
export interface RecentLocation {
  areaId: number;
  areaName: string;
  pincode: string;
}
