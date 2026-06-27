export enum OrderStatus {
  PENDING = 'Bekliyor',
  PREPARED = 'Hazır',
  COMPLETED = 'Tamamlandı',
  CANCELLED = 'İptal',
  SHIPPED = 'Kargolandı'
}

export type PurchaseRequestStatus = 'Bekliyor' | 'Onaylandı' | 'Reddedildi' | 'Siparişe Dönüştü';

export interface PurchaseRequestItem {
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  estimatedPrice?: number;
  supplierId?: string;
  supplierName?: string;
}

export interface PurchaseRequest {
  id: string;
  date: string;
  requestedBy: string; // Personnel ID or Name
  department?: string;
  items: PurchaseRequestItem[];
  status: PurchaseRequestStatus;
  notes?: string;
  approvedBy?: string; // Personnel ID
  approvalDate?: string;
  expectedDeliveryDate?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  purchasePrice?: number;
  stock: number;
  unit?: string; // Adet, Paket, Kilo, Metre, Koli vb.
  category: string;
  subCategory?: string;
  image?: string;
  warehouse?: string;
  aisle?: string;
  shelf?: string;
  warehouseStocks?: { warehouseId: string; stock: number; aisle?: string; shelf?: string; }[];
  barcode?: string;
  description?: string;
  brand?: string;
  taxRate?: number;
  variants?: string[];
  serials?: string[];
  showInQuickSale?: boolean;
  minStock?: number;
  hasSerialTracking?: boolean;
  hasLotTracking?: boolean;
  hasExpirationTracking?: boolean;
  currency?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  capacity?: number;
  branch?: string; // Şube
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
  branch?: string; // Şube
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
  isLead?: boolean;
  leadStatus?: 'Yeni' | 'Görüşülüyor' | 'Teklif Verildi' | 'Kazanıldı' | 'Kaybedildi';
  customerGroup?: string; // e.g. 'B2B', 'Perakende', vb.
  efaturaType?: string;
  efaturaScenario?: string;
  efaturaInvoiceType?: string;
  riskLimit?: number;
  assignedUser?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
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
  notes?: string;
  cargoProvider?: string;
  cargoTrackingNumber?: string;
  cargoBarcodeUrl?: string;
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
  unit?: string;
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
  accountId?: string; // e.g. bank account ID or "KASA"
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
  branch?: string; // Şube
  
  records: PersonnelRecord[];
  currency?: string;
  payrollRecords?: any[];
  fixtures?: { id: string; productId: string; productName: string; quantity: number; dateGiven: string; fixtureName?: string; serialNumber?: string; issueDate?: string; returnDate?: string; condition?: string; }[];
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

export interface PermissionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface UserPermissions {
  uretim: PermissionSet;
  satinalma: PermissionSet;
  ceksenet: PermissionSet;
  ariza: PermissionSet;
  personel: PermissionSet;
  hizlisatis: PermissionSet;
  urunler: PermissionSet;
  siparisler: PermissionSet;
  cariler: PermissionSet;
  kasa: PermissionSet;
  teklifler: PermissionSet;
  ajanda: PermissionSet;
  depo: PermissionSet;
  efatura: PermissionSet;
  mutabakat: PermissionSet;
  stoksayim: PermissionSet;
  raporlar: PermissionSet;
  izin_yonetimi?: PermissionSet;
  crm: PermissionSet;
  terminal: PermissionSet;
  dokumanlar?: PermissionSet;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Kullanıcı';
  status: 'Aktif' | 'Pasif';
  permissions?: UserPermissions;
  assignedWarehouse?: string;
  branch?: string; // Şube
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
  sms_api_key?: string;
  sms_api_hash?: string;
  sms_sender_id?: string;
  printer_header_text: string;
  printer_footer_text: string;
  email_template_service_ticket?: string;
  email_template_maintenance?: string;
  email_template_proposal?: string;
  
  // Fatura Şablon Ayarları
  invoiceTemplate_color?: string;
  invoiceTemplate_showQR?: boolean;
  invoiceTemplate_showLogo?: boolean;
  invoiceTemplate_logoUrl?: string;
  invoiceTemplate_notes?: string;
  invoiceTemplate_bankInfo?: string;
  invoiceTemplate_banks?: { id: string; bankName: string; iban: string; accountName: string; }[];
  invoiceTemplate_layoutOrder?: string[]; // e.g. ['info', 'gib', 'logo']
  
  // Fiş Şablon Ayarları
  receiptTemplate_logoPosition?: 'left' | 'center' | 'right' | 'hidden';
  receiptTemplate_logoSize?: number;
  receiptTemplate_showTaxInfo?: boolean;
  receiptTemplate_showAddress?: boolean;
  receiptTemplate_showPhone?: boolean;
  receiptTemplate_fontSize?: string;
  receiptTemplate_paperWidth?: string;
  
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
  prefix_service?: string;
  next_service_id?: number;
  
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
  unit?: string;
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

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  iban: string;
  balance: number;
}

export interface BOMItem {
  productId: string;
  quantity: number;
  unit: string;
}

export interface BOM {
  id: string;
  targetProductId: string;
  name: string;
  items: BOMItem[];
  instructions?: string;
  estimatedTimeMinutes?: number;
  isActive: boolean;
}

export type WorkOrderStatus = 'Planlandı' | 'Üretimde' | 'Kalite Kontrol' | 'Tamamlandı' | 'İptal';

export interface WorkOrder {
  id: string;
  bomId: string;
  targetProductId: string;
  plannedQuantity: number;
  producedQuantity: number;
  status: WorkOrderStatus;
  startDate?: string;
  endDate?: string;
  assignedTo?: string; // Personnel or Station
  lotNumber?: string;
  priority: 'Düşük' | 'Normal' | 'Yüksek' | 'Kritik (Savunma/Havacılık)';
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface ReminderNote {
  id: string;
  title: string;
  description: string;
  date: string;
  notificationTime?: string;
  notificationSent?: boolean;
  type: ReminderNoteType;
  isCompleted: boolean;
  relatedId?: string; // ID referencing a proposal, customer, personnel, etc.
  amount?: number;
}

export interface AttendanceRecord {
  id: string;
  personnelId: string;
  date: string;
  status: 'Geldi' | 'Gelmedi' | 'İzinli' | 'Raporlu';
  entryTime?: string;
  exitTime?: string;
  overtimeHours?: number;
}

export interface SalaryAdjustment {
  id: string;
  personnelId: string;
  date: string;
  type: 'Avans' | 'Kesinti' | 'Prim';
  amount: number;
  description: string;
}

export interface PersonnelTask {
  id: string;
  personnelId: string;
  title: string;
  description: string;
  status: 'Bekliyor' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal';
  dueDate: string;
  createdAt: string;
  priority: 'Düşük' | 'Normal' | 'Yüksek';
}

export interface PersonnelKPI {
  id: string;
  personnelId: string;
  month: string; // 'YYYY-MM'
  targetSalesAmount: number;
  actualSalesAmount: number;
  targetNewLeads: number;
  actualNewLeads: number;
}

export interface MeetingNote {
  id: string;
  customerId: string;
  date: string;
  notes: string;
  nextContactDate?: string;
  personnelId?: string;
}

export type ChequeNoteStatus = 'Portföyde' | 'Tahsilde' | 'Ciro Edildi' | 'Tahsil Edildi' | 'Ödendi' | 'Karşılıksız/Ödenmedi' | 'İade Edildi';

export interface ChequeNote {
  id: string;
  type: 'Çek' | 'Senet';
  isGiven: boolean; // false = Alınan (Müşteriden), true = Verilen (Tedarikçiye)
  documentNumber: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  bankName?: string;
  branchName?: string;
  accountNumber?: string;
  drawer?: string;
  endorser?: string;
  status: ChequeNoteStatus;
  notes?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  customerGroup?: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Document {
  id: string;
  name: string;
  category: 'Fatura' | 'Teklif' | 'İrsaliye' | 'Sözleşme' | 'Diğer';
  tags: string[];
  uploadDate: string;
  size: number; // in bytes
  type: string; // mime type
  url?: string;
  uploadedBy?: string;
  relatedEntityId?: string;
}

