import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';
import type { CustomerProductsPage } from '@/features/categories/api/categoriesApi';

import type {
  ActiveOffer,
  HomeBanner,
  HomeCampaign,
  HomeFeaturedCategory,
} from '../types/home.types';

/**
 * Customer home-content reads - all public (no auth), all served from
 * `/api/customer/...` rather than `/api/v1/...` (see `API_CONFIG.HOME`).
 *
 * Banners/categories are plain arrays, already filtered server-side to
 * active rows inside their schedule window and sorted by `display_order`
 * - nothing here re-filters or re-sorts them. The two product sections
 * return the SAME paginated card shape as the catalogue's customer
 * listing (`CustomerProductsPage`), so they go through the same
 * `mapCustomerProductCardToProduct` mapper as Categories/Search.
 */
export const getHomeBannersApi = async (): Promise<HomeBanner[]> => {
  const response = await api.get<HomeBanner[]>(API_CONFIG.HOME.BANNERS);
  return response.data;
};

export const getHomeCategoriesApi = async (): Promise<
  HomeFeaturedCategory[]
> => {
  const response = await api.get<HomeFeaturedCategory[]>(
    API_CONFIG.HOME.CATEGORIES,
  );
  return response.data;
};

/** `ProductListQuery` on the server: `limit` 1-100 (default 10), `offset`
 * >= 0, plus optional `category_id`/`product_id`/`search` - only paging is
 * used here. */
export interface HomeProductsParams {
  limit?: number;
  offset?: number;
}

export const getTodaysFreshApi = async ({
  limit = 10,
  offset = 0,
}: HomeProductsParams = {}): Promise<CustomerProductsPage> => {
  const response = await api.get<CustomerProductsPage>(
    API_CONFIG.HOME.TODAYS_FRESH,
    { params: { limit, offset } },
  );
  return response.data;
};

export const getComboPacksApi = async ({
  limit = 10,
  offset = 0,
}: HomeProductsParams = {}): Promise<CustomerProductsPage> => {
  const response = await api.get<CustomerProductsPage>(
    API_CONFIG.HOME.COMBO_PACKS,
    { params: { limit, offset } },
  );
  return response.data;
};

/** GET /api/customer/offers/active/ - already ordered by `display_order`. */
export const getActiveOffersApi = async (): Promise<ActiveOffer[]> => {
  const response = await api.get<ActiveOffer[]>(API_CONFIG.HOME.OFFERS_ACTIVE);
  return response.data;
};

/** GET /api/customer/offers/{id}/products/ - the products an offer applies
 * to, with the offer's pricing already applied by the server. */
export const getOfferProductsApi = async (
  offerId: number,
  { limit = 10, offset = 0 }: HomeProductsParams = {},
): Promise<CustomerProductsPage> => {
  const response = await api.get<CustomerProductsPage>(
    API_CONFIG.HOME.OFFER_PRODUCTS(offerId),
    { params: { limit, offset } },
  );
  return response.data;
};

/** GET /api/customer/campaigns?placement=HOME_SECTION - live campaigns in
 * display order (no products - see `getCampaignProductsApi`). */
export const getHomeCampaignsApi = async (): Promise<HomeCampaign[]> => {
  const response = await api.get<HomeCampaign[]>(API_CONFIG.HOME.CAMPAIGNS, {
    params: { placement: 'HOME_SECTION' },
  });
  return response.data;
};

/** GET /api/customer/campaigns/{id}/products?limit&offset - the normal
 * paginated customer card listing, one card per selected variant. */
export const getCampaignProductsApi = async (
  campaignId: number,
  { limit = 10, offset = 0 }: HomeProductsParams = {},
): Promise<CustomerProductsPage> => {
  const response = await api.get<CustomerProductsPage>(
    API_CONFIG.HOME.CAMPAIGN_PRODUCTS(campaignId),
    { params: { limit, offset } },
  );
  return response.data;
};
