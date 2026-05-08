import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: 'PRD-001', name: 'Kablosuz Kulaklık', price: 1250.00, stock: 45, category: 'Elektronik', warehouse: 'Ana Depo', barcode: '8691234567890' },
  { id: '2', code: 'PRD-002', name: 'Akıllı Saat', price: 3400.00, stock: 12, category: 'Elektronik', warehouse: 'Şube Depo', barcode: '8691234567891' },
  { id: '3', code: 'PRD-003', name: 'Laptop Çantası', price: 450.00, stock: 120, category: 'Aksesuar', warehouse: 'Ana Depo', barcode: '8691234567892' },
  { id: '4', code: 'PRD-004', name: 'USB-C Kablo', price: 150.00, stock: 0, category: 'Aksesuar', warehouse: 'Ana Depo', barcode: '8691234567893' },
];
