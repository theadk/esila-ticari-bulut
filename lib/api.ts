import { safeSessionStorage } from './/storage';
import { Product, Warehouse, Category, Brand } from '../types';

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const tenantId = safeSessionStorage.getItem('esila_tenant_id') || '1111111111';
  const userId = safeSessionStorage.getItem('esila_user_id') || '';
  const headers = new Headers(init?.headers || {});
  headers.set('x-tenant-id', tenantId);
  if (userId) {
    headers.set('x-user-id', userId);
  }
  return fetch(input, { ...init, headers });
}

export const api = {
  async getCategories(): Promise<Category[]> {
    const response = await apiFetch('/api/categories');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addCategory(category: Category): Promise<Category> {
    const response = await apiFetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async updateCategory(id: string, category: Category): Promise<Category> {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async deleteCategory(id: string): Promise<void> {
    const response = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
  },
  async getBrands(): Promise<Brand[]> {
    const response = await apiFetch('/api/brands');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addBrand(brand: Brand): Promise<Brand> {
    const response = await apiFetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async updateBrand(id: string, brand: Brand): Promise<Brand> {
    const response = await apiFetch(`/api/brands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async deleteBrand(id: string): Promise<void> {
    const response = await apiFetch(`/api/brands/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
  },
  async getProducts(): Promise<Product[]> {
    const response = await apiFetch('/api/products');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addProduct(product: Product): Promise<Product> {
    const response = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async updateProduct(id: string, product: Product): Promise<Product> {
    const response = await apiFetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async deleteProduct(id: string): Promise<void> {
    const response = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
  },
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await apiFetch('/api/warehouses');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addWarehouse(warehouse: Warehouse): Promise<Warehouse> {
    const response = await apiFetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },

  async updateWarehouse(id: string, warehouse: Warehouse): Promise<Warehouse> {
    const response = await apiFetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },

  async deleteWarehouse(id: string): Promise<void> {
    const response = await apiFetch(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
  },
  
  async getStockTransfers(): Promise<any[]> {
    const response = await apiFetch('/api/stock_transfers');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addStockTransfer(transfer: any): Promise<any> {
    const response = await apiFetch('/api/stock_transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transfer),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  }
};
