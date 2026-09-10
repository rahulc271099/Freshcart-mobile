/**
 * Field names here match the confirmed API contract exactly
 * (`address_line_1`, `city`, `pincode`, ...) so this type slots directly
 * onto real request/response bodies with no translation layer needed -
 * see `api/addressesApi.ts`.
 */
export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface Address {
  id: string;
  label: AddressLabel;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

/** Shape of the editable fields in the add/edit address form. */
export type AddressInput = Omit<Address, 'id' | 'is_default'>;
