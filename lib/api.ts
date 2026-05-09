import { Product, Warehouse, Category } from '../types';

export const api = {
  async getCategories(): Promise<Category[]> {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addCategory(category: Category): Promise<Category> {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async updateCategory(id: string, category: Category): Promise<Category> {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
  },
  async getProducts(): Promise<Product[]> {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addProduct(product: Product): Promise<Product> {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async updateProduct(id: string, product: Product): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },
  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
  },
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await fetch('/api/warehouses');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  async addWarehouse(warehouse: Warehouse): Promise<Warehouse> {
    const response = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },

  async updateWarehouse(id: string, warehouse: Warehouse): Promise<Warehouse> {
    const response = await fetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  },

  async deleteWarehouse(id: string): Promise<void> {
    const response = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Network response was not ok');
  }
};
