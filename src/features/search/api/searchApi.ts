import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';
import type { CustomerProductsPage } from '@/features/categories/api/categoriesApi';

/**
 * Search reuses the SAME endpoint Categories uses for its product grid
 * (`GET /api/v1/catalogue/customer/products/`) - the backend's
 * `CustomerProductFilters` (see `core/api/v1/catalogue/customer_views.py`)
 * already accepts an optional `search` query param alongside
 * `group_id`/`category_id`/`brand_id`, matching against product
 * name/regional name server-side. There is no separate search-specific
 * endpoint, so `CustomerProductsPage`/`CustomerProductCard` are reused
 * as-is rather than redeclared here.
 */
export interface SearchCustomerProductsParams {
  query: string;
  limit?: number;
  offset?: number;
}

export const searchCustomerProductsApi = async ({
  query,
  limit = 20,
  offset = 0,
}: SearchCustomerProductsParams): Promise<CustomerProductsPage> => {
  const response = await api.get<CustomerProductsPage>(
    API_CONFIG.PRODUCTS.CUSTOMER_LIST,
    { params: { search: query, limit, offset } },
  );
  return response.data;
};
