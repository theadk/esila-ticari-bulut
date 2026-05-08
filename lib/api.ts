import { Product, Warehouse } from '../types';

export const api = {
  async getProducts(): Promise<Product[]> {
    const response = await fetch('/api/products');
    return await response.json();
  },
  async addProduct(product: Product): Promise<Product> {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return await response.json();
  },
  async updateProduct(id: string, product: Product): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return await response.json();
  },
  async deleteProduct(id: string): Promise<void> {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
  },
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await fetch('/api/warehouses');
    return await response.json();
  },
  async addWarehouse(warehouse: Warehouse): Promise<Warehouse> {
    const response = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    return await response.json();
  }
};
