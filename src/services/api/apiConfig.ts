const API_CONFIG = {
  // ── Auth ────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/users/auth/otp/request/',
    VERIFY_OTP: '/users/auth/otp/verify/',
    REFRESH_TOKEN: '/users/auth/token/refresh/',
    LOGOUT: '/users/auth/logout/',
  },

  // ── User / Profile ───────────────────────────────────────────────────────
  // Matches the confirmed contract exactly:
  //   GET   /api/v1/users/me/
  //   PATCH /api/v1/users/me/profile/   { first_name, last_name }
  USER: {
    PROFILE: '/users/me/',
    UPDATE_PROFILE: '/users/me/profile/',
  },

  // ── Products ─────────────────────────────────────────────────────────────
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
  },

  // ── Categories ───────────────────────────────────────────────────────────
  CATEGORIES: {
    LIST: '/categories',
  },

  // ── Cart ─────────────────────────────────────────────────────────────────
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
  },

  // ── Orders ───────────────────────────────────────────────────────────────
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
  },

  // ── Addresses ────────────────────────────────────────────────────────────
  // Matches the confirmed contract exactly (method + path + trailing
  // slashes) - do not "clean up" these paths without re-checking against
  // that contract first.
  ADDRESSES: {
    LIST: '/users/me/addresses/',
    CREATE: '/users/me/addresses/',
    UPDATE: (id: string) => `/users/me/addresses/${id}/`,
    DELETE: (id: string) => `/users/me/addresses/${id}/`,
    SET_DEFAULT: (id: string) => `/users/me/addresses/${id}/default/`,
  },
} as const;

export default API_CONFIG;
