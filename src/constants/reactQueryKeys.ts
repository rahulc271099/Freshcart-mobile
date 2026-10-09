export const QUERY_KEYS = {
  AUTH: {
    all: ['auth'] as const,
  },

  USER: {
    all: ['user'] as const,
    profile: () => ['user', 'profile'] as const,
  },

  PRODUCTS: {
    all: ['products'] as const,
    list: (params?: unknown) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    tree: () => ['products', 'tree'] as const,
    // Customer-facing catalogue reads (see features/categories/api and
    // features/product/api).
    customerList: (groupId: number | null) =>
      ['products', 'customer-list', groupId] as const,
    customerDetail: (productId: string) =>
      ['products', 'customer-detail', productId] as const,
    quantityChoices: (productId: string) =>
      ['products', 'quantity-choices', productId] as const,
    variants: (productId: string) => ['products', 'variants', productId] as const,
  },

  CATEGORIES: {
    all: ['categories'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },

  GROUPS: {
    all: ['groups'] as const,
    list: () => ['groups', 'list'] as const,
  },

  CART: {
    all: ['cart'] as const,
  },

  ORDERS: {
    all: ['orders'] as const,
    list: () => ['orders', 'list'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },

  ADDRESSES: {
    all: ['addresses'] as const,
    detail: (id: string) => ['addresses', 'detail', id] as const,
  },

  HOME: {
    all: ['home'] as const,
    banners: () => ['home', 'banners'] as const,
    categories: () => ['home', 'categories'] as const,
    todaysFresh: () => ['home', 'todays-fresh'] as const,
    comboPacks: () => ['home', 'combo-packs'] as const,
    // `offers()` is the prefix of both keys below, so one invalidate on it
    // refreshes the offer list and every offer's products together.
    campaigns: () => ['home', 'campaigns'] as const,
    campaignList: () => ['home', 'campaigns', 'list'] as const,
    // Prefix of both the Home preview (limit 10) and the See all pages.
    campaignProducts: (campaignId: number) =>
      ['home', 'campaigns', campaignId, 'products'] as const,
    offers: () => ['home', 'offers'] as const,
    activeOffers: () => ['home', 'offers', 'active'] as const,
    offerProducts: (offerId: number) =>
      ['home', 'offers', offerId, 'products'] as const,
  },

  DELIVERY: {
    all: ['delivery'] as const,
    selected: () => ['delivery', 'selected-area'] as const,
  },

  OFFERS: {
    all: ['offers'] as const,
    cart: () => ['offers', 'cart'] as const,
  },

  NOTIFICATIONS: {
    all: ['notifications'] as const,
    detail: (id: string) => ['notifications', 'detail', id] as const,
  },

  WISHLIST: {
    all: ['wishlist'] as const,
  },

  SEARCH: {
    all: ['search'] as const,
    products: (query: string) => ['search', 'products', query] as const,
  },
} as const;