/**
 * Field names here match the confirmed API contract exactly
 * (`AddressSerializer`/`AddressWriteSerializer`/`AddressUpdateSerializer`
 * in core/api/v1/users/serializers.py) so this type slots directly onto
 * real request/response bodies with no translation layer needed - see
 * `api/addressesApi.ts`.
 */
export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface Address {
  address_id: number;
  /** The delivery area this address was validated against (`AddressSerializer
   * .deliveryAreaId`). `null` for an address saved before delivery areas
   * existed - it can't be ordered to until it's edited and re-pinned. */
  deliveryAreaId: number | null;
  mapAddress: string | null;
  address_type: AddressType | null;
  contact_name: string;
  contact_mobile: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  district: string | null;
  state: string;
  country_code: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  is_default: boolean;
}

/** Payload for POST /users/me/addresses/ - matches `AddressWriteSerializer`
 * exactly (required vs optional fields, including `country_code` defaulting
 * server-side to "IN" when omitted). */
export type AddressInput = {
  /** Required by the backend on create: the area the postal code and
   * coordinates are validated against. */
  delivery_area_id?: number | null;
  map_address?: string | null;
  address_type?: AddressType | null;
  contact_name: string;
  contact_mobile: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  district?: string | null;
  state: string;
  country_code?: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  delivery_instructions?: string | null;
  is_default?: boolean;
};

/** Payload for PATCH /users/me/addresses/{id}/ - every field optional,
 * matches `AddressUpdateSerializer` (the repository COALESCEs untouched
 * columns server-side). */
export type AddressUpdateInput = Partial<AddressInput>;
