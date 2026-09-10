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
  },

  CATEGORIES: {
    all: ['categories'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },

  CART: {
    all: ['cart'] as const,
  },

  ORDERS: {
    all: ['orders'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },

  ADDRESSES: {
    all: ['addresses'] as const,
    detail: (id: string) => ['addresses', 'detail', id] as const,
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