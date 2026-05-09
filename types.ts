export enum OrderStatus {
  PENDING = 'Bekliyor',
  COMPLETED = 'Tamamlandı',
  CANCELLED = 'İptal',
  SHIPPED = 'Kargolandı'
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  subCategory?: string;
  image?: string;
  warehouse?: string;
  barcode?: string;
  description?: string;
  brand?: string;
  taxRate?: number;
  variants?: string[];
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  capacity?: number;
}

export interface Category {
  id: string;
  name: string;
  subCategories: string[];
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  date: string;
  type: 'Satış' | 'Alış' | 'Tahsilat' | 'Ödeme';
  amount: number;
  description: string;
}

export interface Customer {
  id: string;
  customerType: 'Şahıs' | 'Tüzel';
  name: string; // Ad Soyad / Yetkili
  companyName: string; // Firma Adı / Ünvan
  email: string;
  phone: string;
  city?: string;
  district?: string;
  address: string;
  taxOffice?: string;
  taxNumber?: string;
  iban?: string;
  type: 'Alıcı' | 'Satıcı';
  balance: number;
  status: 'Aktif' | 'Pasif';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
}

export interface Settings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  marketplace_trendyol_api: string;
  marketplace_hepsiburada_api: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  sms_token: string;
  printer_header_text: string;
  printer_footer_text: string;
}