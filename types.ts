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
  image?: string;
  warehouse?: string;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
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