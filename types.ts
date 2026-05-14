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

export interface Brand {
  id: string;
  name: string;
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

export enum ProposalStatus {
  PENDING = 'Bekliyor',
  ACCEPTED = 'Onaylandı',
  REJECTED = 'Reddedildi'
}

export interface ProposalItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discountRate: number; // Yüzde olarak indirim
}

export interface Proposal {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  validUntil: string;
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  status: ProposalStatus;
  items: ProposalItem[];
  notes?: string;
  isConvertedToOrder?: boolean;
}

export interface CashTransaction {
  id: string;
  date: string;
  type: 'Gelir' | 'Gider';
  category: 'Cari Tahsilat' | 'Cari Ödeme' | 'Satış' | 'Alış' | 'Diğer Gelir' | 'Diğer Gider' | 'Fatura Ödemesi' | 'Personel Maaşı' | 'Personel Avans';
  amount: number;
  description: string;
  customerId?: string; // If related to a customer
  personnelId?: string; // If related to an employee
}

export interface PersonnelRecord {
  id: string;
  targetId: string; // Document or note ID
  date: string;
  type: 'Belge' | 'Not' | 'İhtar' | 'Ödül' | 'Maaş Değişikliği' | 'İzin' | 'Rapor';
  title: string;
  description: string;
  documentUrl?: string;
  documentName?: string;
}

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  birthDate: string;
  gender: 'Erkek' | 'Kadın' | 'Diğer';
  bloodType: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  
  // Employment Info
  department: string;
  position: string;
  startDate: string;
  endDate?: string;
  employmentStatus: 'Aktif' | 'Ayrıldı' | 'İzinde';
  salary: number;
  iban: string;
  socialSecurityNo: string; // SGK No
  
  records: PersonnelRecord[];
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