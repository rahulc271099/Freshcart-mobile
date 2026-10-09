import type { Address, AddressType } from '../types/address.types';

/** Human-readable label for a possibly-null backend `address_type` -
 * matches `AddressWriteSerializer`'s own enum (HOME/WORK/OTHER). A saved
 * address with no type set (nullable on the backend) reads as "Other"
 * rather than leaving a blank label. */
export function addressTypeLabel(type: AddressType | null): string {
  switch (type) {
    case 'HOME':
      return 'Home';
    case 'WORK':
      return 'Work';
    default:
      return 'Other';
  }
}

/** One-line, comma-joined rendering of a full address - shared by every
 * card that displays one (AddressCard, AddressOptionCard,
 * AddressSummaryCard) so the formatting only lives in one place. */
export function formatAddressLine(address: Address): string {
  return [
    address.address_line1,
    address.address_line2,
    address.landmark,
    [address.city, address.district].filter(Boolean).join(', '),
    `${address.state} ${address.postal_code}`.trim(),
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(', ');
}
