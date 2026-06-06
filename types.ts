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
  purchasePrice?: number;
  stock: number;
  category: string;
  subCategory?: string;
  image?: string;
  warehouse?: string;
  warehouseStocks?: { warehouseId: string; stock: number }[];
  barcode?: string;
  description?: string;
  brand?: string;
  taxRate?: number;
  variants?: string[];
  showInQuickSale?: boolean;
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

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  quantity: number;
  date: string;
  personnelName: string;
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
  efaturaType?: string;
  efaturaScenario?: string;
  efaturaInvoiceType?: string;
  riskLimit?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  taxRate?: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  subTotal?: number;
  taxTotal?: number;
  total: number;
  currency?: string;
  exchangeRate?: number;
  status: OrderStatus;
  items: OrderItem[];
  proposalId?: string;
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
  taxRate?: number;
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

export interface Payroll {
  id: string;
  date: string; // YYYY-MM
  workedDays: number;
  basicSalary: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: 'Ödendi' | 'Bekliyor';
  emailSentAt?: string;
}

export interface JobApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  positionApplied: string;
  applicationDate: string;
  status: 'Yeni' | 'İnceleniyor' | 'Mülakat' | 'Teklif' | 'Kabul Edildi' | 'Reddedildi';
  resumeUrl?: string;
  notes?: string;
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
  fixtures?: { id: string; productId: string; productName: string; quantity: number; dateGiven: string; }[];
  payrolls?: Payroll[];

  // Leave Management
  annualLeaveEntitlement?: number;
  leaveRecords?: {
    id: string;
    startDate: string;
    endDate: string;
    type: 'Yıllık İzin' | 'Mazeret İzni' | 'Ücretsiz İzin' | 'Hastalık İzni' | 'Diğer';
    days: number;
    status: 'Bekliyor' | 'Onaylandı' | 'Reddedildi';
    description?: string;
  }[];
}

export enum ReconciliationStatus {
  PENDING = 'Bekliyor',
  APPROVED = 'Onaylandı',
  REJECTED = 'Reddedildi'
}

export interface Reconciliation {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  balanceType: 'Borç' | 'Alacak' | 'Yok';
  balance: number;
  status: ReconciliationStatus;
  notes?: string;
  emailSentAt?: string;
  respondedAt?: string;
  responseNotes?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Kullanıcı';
  status: 'Aktif' | 'Pasif';
}

export interface Settings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  authorized_person?: string;
  barcode_type?: '1D' | 'QR';
  taxOffice?: string;
  taxNumber?: string;
  companyLogo?: string;
  bankName?: string;
  iban?: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass?: string;
  sms_token: string;
  sms_sender_id?: string;
  printer_header_text: string;
  printer_footer_text: string;
  
  // Fatura Şablon Ayarları
  invoiceTemplate_color?: string;
  invoiceTemplate_showQR?: boolean;
  invoiceTemplate_showLogo?: boolean;
  invoiceTemplate_logoUrl?: string;
  invoiceTemplate_notes?: string;
  invoiceTemplate_bankInfo?: string;
  invoiceTemplate_banks?: { id: string; bankName: string; iban: string; accountName: string; }[];
  invoiceTemplate_layoutOrder?: string[]; // e.g. ['info', 'gib', 'logo']
  
  // Numaralandırma / Ön Ekler
  prefix_customer?: string;
  next_customer_id?: number;
  prefix_order?: string;
  next_order_id?: number;
  prefix_offer?: string;
  next_offer_id?: number;
  prefix_product?: string;
  next_product_id?: number;
  prefix_personnel?: string;
  next_personnel_id?: number;
  prefix_efatura?: string;
  next_efatura_id?: number;
  prefix_earsiv?: string;
  next_earsiv_id?: number;
  
  // Mail Şablonları
  email_template_customer?: string;
  email_template_reconciliation?: string;
  email_template_personnel?: string;
  
  // E-Fatura Entegrasyon
  efatura_username?: string;
  efatura_password?: string;
  efatura_apikey?: string;
  
  // Arıza/Bakım Formu Tesisat Kontrol Listesi Şablonu
  plumbingChecklistTemplate?: string[];
}

export enum ServiceTicketStatus {
  PENDING = 'Bekliyor',
  IN_PROGRESS = 'İşlemde',
  COMPLETED = 'Tamamlandı',
  CANCELLED = 'İptal'
}

export interface ServiceMaterial {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  source?: 'Zimmet' | 'Depo';
  fixtureId?: string;
}

export interface ServiceTicket {
  id: string;
  customerId: string;
  customerName: string;
  personnelId?: string;
  personnelName?: string;
  deviceType: string;
  serialNumber?: string;
  issueDescription: string;
  status: ServiceTicketStatus;
  dateCreated: string;
  dateCompleted?: string;
  materialsUsed: ServiceMaterial[];
  laborFee: number;
  taxRate: number;
  totalCost: number;
  resolutionNotes?: string;
  nextMaintenanceDate?: string;
  maintenancePeriodMonths?: number;
  maintenanceReminderSent?: boolean;
  plumbingChecklist?: { itemName: string; isChecked: boolean }[];
}

export type ReminderNoteType = 'Teklif' | 'Ödeme' | 'Tahsilat' | 'Personel' | 'Sipariş' | 'Banka' | 'Genel';

export interface ReminderNote {
  id: string;
  title: string;
  description: string;
  date: string;
  type: ReminderNoteType;
  isCompleted: boolean;
  relatedId?: string; // ID referencing a proposal, customer, personnel, etc.
  amount?: number;
}