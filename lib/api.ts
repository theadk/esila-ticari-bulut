import { Product, Warehouse, Category, Brand } from '../types';
import { sanitizeClientPayload } from './securityGuard';

interface CacheEntry<T = any> {
  data: T;
  etag?: string;
  timestamp: number;
}

const API_CACHE_TTL_MS = 30 * 1000; // 30 seconds client-side cache
const apiCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

function getCacheKey(url: string): string {
  const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
  return `${tenantId}:${url}`;
}

export function primeApiCache(endpoint: string, data: any) {
  if (!Array.isArray(data)) return;
  const key = getCacheKey(endpoint);
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function invalidateApiCache(endpoint?: string) {
  if (!endpoint) {
    apiCache.clear();
    return;
  }
  const key = getCacheKey(endpoint);
  apiCache.delete(key);
}

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
  const userId = localStorage.getItem('esila_user_id') || '';
  const headers = new Headers(init?.headers || {});
  headers.set('x-tenant-id', tenantId);
  if (userId) {
    headers.set('x-user-id', userId);
  }
  let sanitizedInit = init;
  if (init?.body && typeof init.body === 'string') {
    try {
      const parsed = JSON.parse(init.body);
      sanitizedInit = { ...init, body: JSON.stringify(sanitizeClientPayload(parsed)) };
    } catch (_e) {}
  }
  return fetch(input, { ...sanitizedInit, headers });
}

async function cachedGetArray<T>(endpoint: string): Promise<T[]> {
  const cacheKey = getCacheKey(endpoint);
  const now = Date.now();
  const cached = apiCache.get(cacheKey);

  // Return fresh cache immediately without network round-trip
  if (cached && now - cached.timestamp < API_CACHE_TTL_MS) {
    return cached.data as T[];
  }

  // Deduplicate concurrent identical GET requests
  const existingInFlight = inFlightRequests.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const requestPromise = (async () => {
    try {
      const headers: Record<string, string> = {};
      if (cached?.etag) {
        headers['If-None-Match'] = cached.etag;
      }
      const response = await apiFetch(endpoint, { headers });
      if (response.status === 304 && cached) {
        cached.timestamp = Date.now();
        return cached.data as T[];
      }
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const arr = Array.isArray(data) ? data : [];
      const etag = response.headers.get('ETag') || undefined;
      apiCache.set(cacheKey, {
        data: arr,
        etag,
        timestamp: Date.now()
      });
      return arr;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

export const api = {
  async getCategories(): Promise<Category[]> {
    return cachedGetArray<Category>('/api/categories');
  },
  async addCategory(category: Category): Promise<Category> {
    const response = await apiFetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/categories');
    return await response.json();
  },
  async updateCategory(id: string, category: Category): Promise<Category> {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/categories');
    return await response.json();
  },
  async deleteCategory(id: string): Promise<void> {
    const response = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/categories');
  },
  async getBrands(): Promise<Brand[]> {
    return cachedGetArray<Brand>('/api/brands');
  },
  async addBrand(brand: Brand): Promise<Brand> {
    const response = await apiFetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/brands');
    return await response.json();
  },
  async updateBrand(id: string, brand: Brand): Promise<Brand> {
    const response = await apiFetch(`/api/brands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/brands');
    return await response.json();
  },
  async deleteBrand(id: string): Promise<void> {
    const response = await apiFetch(`/api/brands/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/brands');
  },
  async getProducts(): Promise<Product[]> {
    return cachedGetArray<Product>('/api/products');
  },
  async addProduct(product: Product): Promise<Product> {
    const response = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/products');
    return await response.json();
  },
  async updateProduct(id: string, product: Product): Promise<Product> {
    const response = await apiFetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/products');
    return await response.json();
  },
  async deleteProduct(id: string): Promise<void> {
    const response = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/products');
  },
  async getWarehouses(): Promise<Warehouse[]> {
    return cachedGetArray<Warehouse>('/api/warehouses');
  },
  async addWarehouse(warehouse: Warehouse): Promise<Warehouse> {
    const response = await apiFetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/warehouses');
    return await response.json();
  },
  async updateWarehouse(id: string, warehouse: Warehouse): Promise<Warehouse> {
    const response = await apiFetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/warehouses');
    return await response.json();
  },
  async deleteWarehouse(id: string): Promise<void> {
    const response = await apiFetch(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/warehouses');
  },
  async getStockTransfers(): Promise<any[]> {
    return cachedGetArray<any>('/api/stock_transfers');
  },
  async addStockTransfer(transfer: any): Promise<any> {
    const response = await apiFetch('/api/stock_transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transfer),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    invalidateApiCache('/api/stock_transfers');
    return await response.json();
  }
};

