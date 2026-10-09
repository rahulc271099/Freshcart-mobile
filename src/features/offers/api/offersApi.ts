import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';

import type { CartOffer } from '../types/offer.types';

/**
 * GET /api/v1/offers/?scope=CART
 *
 * Checked directly against the live server (`core/api/v1/offers/views.py`
 * `OfferListView.get`): for a non-admin caller it ALWAYS calls
 * `OfferService.list_active_offers()` - the `scope` query param isn't
 * read anywhere in that view, so the server returns every currently
 * active offer regardless of scope, already filtered to `Status =
 * 'ACTIVE' AND IsActive AND ValidFrom <= NOW() AND ValidTo > NOW()` and
 * ordered by `DisplayOrder` (see `LIST_ACTIVE_OFFERS` in
 * `core/repositories/offers/sql/offer_queries.py`). The `scope=CART`
 * filtering therefore has to happen client-side, below - the query
 * string is still sent (in case the server contract changes to honor it
 * later) but isn't relied on.
 *
 * Response is a plain (unwrapped) array - not the `ApiEnvelope<T>` shape
 * the `users` app uses.
 */
export const getCartOffersApi = async (): Promise<CartOffer[]> => {
  const response = await api.get<CartOffer[]>(API_CONFIG.OFFERS.LIST, {
    params: { scope: 'CART' },
  });
  return response.data.filter(offer => offer.scope === 'CART');
};
