/**
 * Response shapes for the customer home-content endpoints - matches
 * `core/repositories/home_content/home_content_repository.py`'s
 * `listing(kind, customer=True)` column list exactly. Unlike the
 * catalogue's customer reads (camelCase), these come back snake_case and
 * as a plain array (no `{success, data}` envelope).
 */

/** Where tapping a banner should go - `BannerWrite.redirect_type`'s
 * choices on the server. `redirect_id` is the target's id for every type
 * except `NONE`/`URL`; `redirect_url` is only set for `URL`. */
export type BannerRedirectType =
  | 'NONE'
  | 'OFFER'
  | 'CATEGORY'
  | 'PRODUCT'
  | 'COMBO'
  | 'CAMPAIGN'
  | 'URL';

export type HomeBanner = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  redirect_type: BannerRedirectType;
  redirect_id: number | null;
  redirect_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** One featured category tile. `id` is the home-content row's own id;
 * `category_id` is the real catalogue category it points at. The server
 * only returns rows whose category is active, already in display order. */
export type HomeFeaturedCategory = {
  id: number;
  category_id: number;
  display_order: number;
  is_active: boolean;
  name: string;
  display_name: string | null;
  image_url: string | null;
  category_active: boolean;
  created_at: string;
  updated_at: string;
};

/** One row of `GET /api/customer/offers/active/` (`HomeContentService.
 * active_offers`). `scope` says what the offer applies to - `CART` offers
 * have no product listing, so Home only builds sections for the others. */
export type ActiveOffer = {
  offer_id: number;
  title: string;
  subtitle: string | null;
  banner_image_url: string | null;
  offer_type: string;
  scope: 'PRODUCT' | 'VARIANT' | 'CATEGORY' | 'CART';
  valid_from: string;
  valid_to: string;
  display_order: number;
};

/** One row of `GET /api/customer/campaigns?placement=HOME_SECTION`
 * (`CampaignRepository.listing(customer=True)`). Only live campaigns come
 * back, already in `display_order`. The row carries NO products - they are
 * loaded per campaign from `/customer/campaigns/{id}/products`. */
export type HomeCampaign = {
  id: number;
  campaign_id: number;
  campaign_name: string;
  subtitle: string | null;
  description: string | null;
  campaign_type: string;
  placement: 'HOME_SECTION' | 'CATEGORY_PAGE' | 'SEARCH_PAGE';
  category_id: number | null;
  search_keyword: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
  item_count: number;
  linked_banner_count: number;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED';
};
