import type { Address } from '../types/address.types';

/** Backend rule for an address contact number: 10-digit Indian mobile
 * starting 6-9 (`AddressWriteSerializer.contact_mobile`). */
const PHONE_RE = /^[6-9]\d{9}$/;

/**
 * Why a saved address can't be ordered to yet, or `null` when it's fine.
 * Mirrors what the backend actually enforces at order time
 * (`DeliveryAreaService.checkout` -> `require`): the pincode must belong
 * to the address's own area OR - for older addresses saved with no area -
 * the shopper's selected area (the server falls back to it). A missing
 * `deliveryAreaId` or map pin is therefore NOT a blocker here; if the
 * server wants more it replies with its own coded error, which the
 * checkout screens show.
 */
export function getAddressBlocker(address: Address): string | null {
  const last10 = address.contact_mobile.replace(/\D/g, '').slice(-10);
  if (!PHONE_RE.test(last10)) {
    return 'Contact number is invalid - edit to fix it';
  }
  return null;
}
