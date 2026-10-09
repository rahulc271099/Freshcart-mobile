import ROOT_CONFIG from '@/config/api';

const API_CONFIG = {
  // ── Auth ────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/users/auth/otp/request/',
    VERIFY_OTP: '/users/auth/otp/verify/',
    REFRESH_TOKEN: '/users/auth/token/refresh/',
    LOGOUT: '/users/auth/logout/',
  },

  // ── User / Profile ───────────────────────────────────────────────────────
  // Matches the confirmed contract exactly (core/api/v1/users/urls.py +
  // users/views.py - these are two DIFFERENT endpoints/views, do not
  // collapse them):
  //   GET   /api/v1/users/me/          - MyProfileView: full nested
  //                                       profile ({user, roles,
  //                                       customer_profile, preferences}),
  //                                       envelope-wrapped.
  //   PATCH /api/v1/users/me/          - MyProfileView: basic info only
  //                                       ({first_name, last_name, email?,
  //                                       profile_image_url?} -
  //                                       UpdateBasicInfoSerializer).
  //   PATCH /api/v1/users/me/profile/  - MyExtendedProfileView: EXTENDED
  //                                       info only ({date_of_birth?,
  //                                       gender?, preferred_language_code?,
  //                                       notes?} - UpdateExtendedProfileSerializer).
  //                                       NOT for name changes - DRF
  //                                       silently drops unrecognized
  //                                       fields, so a first_name/last_name
  //                                       PATCH here would appear to
  //                                       succeed while changing nothing.
  USER: {
    PROFILE: '/users/me/',
    UPDATE_EXTENDED_PROFILE: '/users/me/profile/',
  },

  // ── Products ─────────────────────────────────────────────────────────────
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    // Matches the confirmed contract exactly:
    //   GET /api/v1/catalogue/products/tree/
    // Verified directly against the deployed server - returns every active
    // product (each with its nested `variants`) in one call, not scoped by
    // category/group via query params. Superseded by CUSTOMER_LIST below
    // for the Categories screen (this fetches the ENTIRE catalogue on
    // every load, which is both unfiltered and far heavier than the page
    // actually needs) - left here as it's still a simpler/complete source
    // if another screen ever needs the full tree.
    TREE: '/catalogue/products/tree/',
    // ── Customer-facing catalogue reads ──────────────────────────────
    // Matches the confirmed contract exactly:
    //   GET /api/v1/catalogue/customer/products/?group_id=&limit=&offset=
    // Paginated, server-side filterable by group/category/brand/search -
    // what the Categories screen actually fetches per active group,
    // instead of the full unscoped tree above.
    CUSTOMER_LIST: '/catalogue/customer/products/',
    // GET /api/v1/catalogue/customer/products/{id}/
    // Single-product read for the Product Details screen - same base
    // fields the two endpoints below build on, plus a summarized `offer`
    // (see `CustomerProductService.product_detail` on the server).
    CUSTOMER_DETAIL: (id: number | string) => `/catalogue/customer/products/${id}/`,
    // GET /api/v1/catalogue/customer/products/{id}/quantity-choices/
    // Only valid for a product with isCustomQty && !isVariableWeight &&
    // pricingMethod === 'UNIT_RATE' - see resolveOptionsMode() in
    // features/product/utils/productOptions.ts.
    CUSTOMER_QUANTITY_CHOICES: (id: number | string) =>
      `/catalogue/customer/products/${id}/quantity-choices/`,
    // GET /api/v1/catalogue/customer/products/{id}/variants/
    // Valid for every product NOT covered by quantity-choices above.
    CUSTOMER_VARIANTS: (id: number | string) =>
      `/catalogue/customer/products/${id}/variants/`,
  },

  // ── Categories ───────────────────────────────────────────────────────────
  CATEGORIES: {
    LIST: '/categories',
  },

  // ── Groups ───────────────────────────────────────────────────────────────
  // Matches the confirmed contract exactly:
  //   GET /api/v1/catalogue/groups/
  // Flat endpoint - returns every group across every category in one call
  // (the backend also exposes a category-scoped
  // /catalogue/categories/{category_id}/groups/, but the Category screen
  // uses this flat one).
  GROUPS: {
    LIST: '/catalogue/groups/',
  },

  // ── Cart ─────────────────────────────────────────────────────────────────
  // Matches the confirmed contract exactly:
  //   GET/DELETE /api/v1/orders/cart/
  //   POST       /api/v1/orders/cart/items/
  //   PATCH/DELETE /api/v1/orders/cart/items/{cart_item_id}/
  // Every one of these requires auth (see core/api/v1/orders/views.py) -
  // the shared `api` instance already attaches the Bearer token via its
  // request interceptor, same as every other authenticated call in this
  // app.
  CART: {
    GET: '/orders/cart/',
    CLEAR: '/orders/cart/',
    ADD_ITEM: '/orders/cart/items/',
    UPDATE_ITEM: (cartItemId: number | string) =>
      `/orders/cart/items/${cartItemId}/`,
    REMOVE_ITEM: (cartItemId: number | string) =>
      `/orders/cart/items/${cartItemId}/`,
  },

  // ── Orders ───────────────────────────────────────────────────────────────
  // Matches the confirmed contract exactly (core/api/v1/orders/urls.py,
  // included at /api/v1/orders/ - see core/api/v1/urls.py):
  //   GET  /api/v1/orders/       - list the caller's own orders
  //   POST /api/v1/orders/       - place an order from the current cart
  //   GET  /api/v1/orders/{id}/  - a single order
  // Trailing slashes matter here (Django's APPEND_SLASH would otherwise
  // 301-redirect a POST, which can drop the request body) - do not "clean
  // up" these paths without re-checking against that contract first, same
  // rule as ADDRESSES/CART above.
  ORDERS: {
    LIST: '/orders/',
    CREATE: '/orders/',
    DETAIL: (id: string | number) => `/orders/${id}/`,
  },

  // ── Addresses ────────────────────────────────────────────────────────────
  // Matches the confirmed contract exactly (method + path + trailing
  // slashes) - do not "clean up" these paths without re-checking against
  // that contract first.
  // ── Offers ───────────────────────────────────────────────────────────────
  // GET /api/v1/offers/ - public, unwrapped array (OfferSerializer, snake_case
  // fields - see features/offers/types/offer.types.ts). The server does NOT
  // read a `scope` query param (confirmed against core/api/v1/offers/views.py
  // - OfferListView.get ignores everything except admin-only all/limit/offset)
  // so `?scope=CART` is sent for intent/future-proofing but the actual CART
  // filtering happens client-side in getCartOffersApi.
  OFFERS: {
    LIST: '/offers/',
  },

  // ── Home content (customer-facing, public) ───────────────────────────────
  // Matches `core/api/home_content/urls.py`: these four live under
  // `/api/customer/...`, NOT `/api/v1/...`, so they're built as ABSOLUTE
  // URLs off `ROOT_URL` (Axios ignores `baseURL` for an absolute `url`).
  // No auth needed (`CustomerHomeView` is `AllowAny`).
  HOME: {
    BANNERS: `${ROOT_CONFIG.ROOT_URL}/customer/home/banners/`,
    CATEGORIES: `${ROOT_CONFIG.ROOT_URL}/customer/home/categories/`,
    TODAYS_FRESH: `${ROOT_CONFIG.ROOT_URL}/customer/todays-fresh/`,
    COMBO_PACKS: `${ROOT_CONFIG.ROOT_URL}/customer/combo-packs/`,
    // Active offers (all scopes) and one offer's product listing - same
    // paginated card shape as TODAYS_FRESH.
    OFFERS_ACTIVE: `${ROOT_CONFIG.ROOT_URL}/customer/offers/active/`,
    OFFER_PRODUCTS: (offerId: number) =>
      `${ROOT_CONFIG.ROOT_URL}/customer/offers/${offerId}/products/`,
    // Published campaigns for a placement (`?placement=HOME_SECTION`) and
    // one campaign's paginated product cards.
    CAMPAIGNS: `${ROOT_CONFIG.ROOT_URL}/customer/campaigns/`,
    CAMPAIGN_PRODUCTS: (campaignId: number) =>
      `${ROOT_CONFIG.ROOT_URL}/customer/campaigns/${campaignId}/products/`,
  },

  // ── Delivery area (`core/api/delivery_areas/urls.py`) ────────────────────
  // Also under `/api/customer/...` (absolute URLs off `ROOT_URL`, like HOME).
  // CHECK_PINCODE is public; SELECT_AREA / SELECTED_AREA need the Bearer
  // token (the shared `api` instance attaches it).
  DELIVERY: {
    CHECK_PINCODE: `${ROOT_CONFIG.ROOT_URL}/customer/delivery/check-pincode/`,
    SELECT_AREA: `${ROOT_CONFIG.ROOT_URL}/customer/delivery/select-area/`,
    SELECTED_AREA: `${ROOT_CONFIG.ROOT_URL}/customer/delivery/selected-area/`,
    /** POST - pins a saved address as the active delivery address (also sets its area). */
    SELECT_ADDRESS: (id: number) =>
      `${ROOT_CONFIG.ROOT_URL}/customer/addresses/${id}/select/`,
  },

  ADDRESSES: {
    LIST: '/users/me/addresses/',
    CREATE: '/users/me/addresses/',
    // `address_id` is a real integer PK (`AddressSerializer.address_id`),
    // not a string - these used to be typed `(id: string)`.
    UPDATE: (id: number) => `/users/me/addresses/${id}/`,
    DELETE: (id: number) => `/users/me/addresses/${id}/`,
    SET_DEFAULT: (id: number) => `/users/me/addresses/${id}/default/`,
  },
} as const;

export default API_CONFIG;
