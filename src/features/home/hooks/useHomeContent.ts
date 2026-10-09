import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import type { CustomerProductsPage } from '@/features/categories/api/categoriesApi';
import { mapCustomerProductCardToProduct } from '@/features/categories/utils/mapCatalogueData';

import type { ActiveOffer } from '../types/home.types';
import {
  getActiveOffersApi,
  getCampaignProductsApi,
  getHomeCampaignsApi,
  getComboPacksApi,
  getHomeBannersApi,
  getHomeCategoriesApi,
  getOfferProductsApi,
  getTodaysFreshApi,
} from '../api/homeApi';

/** Curated home content changes rarely (an admin edits it), so a short
 * stale window avoids refetching on every tab switch while pull-to-refresh
 * (see `HomeScreen`) still forces a fresh read on demand. */
const STALE_TIME_MS = 2 * 60 * 1000;

/** Module-level (stable identity) so React Query can memoize the mapped
 * result instead of re-running `select` on every render. */
const mapPageToProducts = (page: CustomerProductsPage) =>
  page.results.map(mapCustomerProductCardToProduct);

/** GET /api/customer/home/banners/ */
export const useHomeBanners = () =>
  useQuery({
    queryKey: QUERY_KEYS.HOME.banners(),
    queryFn: getHomeBannersApi,
    staleTime: STALE_TIME_MS,
  });

/** GET /api/customer/home/categories/ */
export const useHomeCategories = () =>
  useQuery({
    queryKey: QUERY_KEYS.HOME.categories(),
    queryFn: getHomeCategoriesApi,
    staleTime: STALE_TIME_MS,
  });

/** GET /api/customer/todays-fresh/ - already mapped to the shared
 * `Product` shape so `ProductSection` can render it directly. */
export const useTodaysFresh = () =>
  useQuery({
    queryKey: QUERY_KEYS.HOME.todaysFresh(),
    queryFn: () => getTodaysFreshApi(),
    staleTime: STALE_TIME_MS,
    select: mapPageToProducts,
  });

/** GET /api/customer/combo-packs/ - same shape/mapping as above. */
export const useComboPacks = () =>
  useQuery({
    queryKey: QUERY_KEYS.HOME.comboPacks(),
    queryFn: () => getComboPacksApi(),
    staleTime: STALE_TIME_MS,
    select: mapPageToProducts,
  });

/** Each active offer becomes one Home section, and each section is its own
 * request - capped so a long offer list can't fire dozens of calls. */
const MAX_OFFER_SECTIONS = 6;

/** Cart-level offers (free delivery, % off the basket...) have no product
 * listing to show, so they're not Home sections. Module-level for a stable
 * `select` identity. */
const selectProductOffers = (offers: ActiveOffer[]) =>
  offers.filter(offer => offer.scope !== 'CART').slice(0, MAX_OFFER_SECTIONS);

/** GET /api/customer/offers/active/ - product-level offers only. */
export const useActiveOffers = () =>
  useQuery({
    queryKey: QUERY_KEYS.HOME.activeOffers(),
    queryFn: getActiveOffersApi,
    staleTime: STALE_TIME_MS,
    select: selectProductOffers,
  });

/** GET /api/customer/offers/{id}/products/ - mapped to the shared
 * `Product` shape. */
export const useOfferProducts = (offerId: number) =>
  useQuery({
    queryKey: QUERY_KEYS.HOME.offerProducts(offerId),
    queryFn: () => getOfferProductsApi(offerId),
    staleTime: STALE_TIME_MS,
    select: mapPageToProducts,
  });

/** Cards shown per campaign on Home before "See all". */
export const HOME_CAMPAIGN_PRODUCT_LIMIT = 10;
/** Page size on the See all screen (server max is 100). */
const CAMPAIGN_PAGE_SIZE = 20;

/** GET /api/customer/campaigns?placement=HOME_SECTION */
export const useHomeCampaigns = () =>
  useQuery({
    queryKey: QUERY_KEYS.HOME.campaignList(),
    queryFn: getHomeCampaignsApi,
    staleTime: STALE_TIME_MS,
  });

/** First `HOME_CAMPAIGN_PRODUCT_LIMIT` products of one campaign, mapped to
 * the shared `Product` shape. */
export const useCampaignPreview = (campaignId: number) =>
  useQuery({
    queryKey: [
      ...QUERY_KEYS.HOME.campaignProducts(campaignId),
      'preview',
    ] as const,
    queryFn: () =>
      getCampaignProductsApi(campaignId, {
        limit: HOME_CAMPAIGN_PRODUCT_LIMIT,
      }),
    staleTime: STALE_TIME_MS,
    select: mapPageToProducts,
  });

/** Every product of one campaign, paged (See all screen). Uses the
 * server's own `hasMore`/`nextOffset` rather than guessing from lengths. */
export const useCampaignProducts = (campaignId: number) =>
  useInfiniteQuery({
    queryKey: [...QUERY_KEYS.HOME.campaignProducts(campaignId), 'all'] as const,
    queryFn: ({ pageParam }) =>
      getCampaignProductsApi(campaignId, {
        limit: CAMPAIGN_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: page => (page.hasMore ? page.nextOffset : undefined),
    staleTime: STALE_TIME_MS,
    select: data => data.pages.flatMap(mapPageToProducts),
  });
