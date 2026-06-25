import { useState, useEffect } from 'react';
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS, MOCK_CASH_TRANSACTIONS, MOCK_PERSONNEL, MOCK_PRODUCTS, MOCK_USERS } from '../mockData';
import { Customer, CustomerTransaction, CashTransaction, Personnel, Order, OrderStatus, Proposal, ProposalStatus, Settings, Product, User, ServiceTicket, JobApplication, ReminderNote, BOM, WorkOrder, AppNotification, AttendanceRecord, SalaryAdjustment, PersonnelKPI, PersonnelTask, MeetingNote, Campaign } from '../types';

let globalSettings: Settings = {
  companyName: 'Esila Örnek Şirket Ltd. Şti.',
  address: 'Örnek Mah. Atatürk Cad. No:1, İstanbul',
  phone: '0850 123 45 67',
  email: 'info@esila.com',
  taxOffice: 'Marmara Kurumlar V.D.',
  taxNumber: '1234567890',
  companyLogo: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: 'bildirim@esila.com',
  smtp_pass: '',
  sms_token: 'A1B2-C3D4-E5F6',
  sms_sender_id: 'ESILA',
  printer_header_text: 'Esila Ticari',
  printer_footer_text: 'Bizi tercih ettiğiniz için teşekkürler!',
  
  prefix_customer: 'CAR',
  next_customer_id: 1001,
  prefix_order: 'SIP',
  next_order_id: 1001,
  prefix_offer: 'TEK',
  next_offer_id: 1001,
  prefix_product: 'URN',
  next_product_id: 1001,
  prefix_personnel: 'PER',
  next_personnel_id: 1001,
  plumbingChecklistTemplate: ['Filtre Kontrolü', 'Boru Sızıntı Kontrolü', 'Su Basıncı Testi', 'Vana Kontrolü', 'Ekipman Temizliği'],
};

let globalCustomers = [
  ...MOCK_CUSTOMERS,
  {
    id: 'LEAD-001',
    customerType: 'Tüzel',
    name: 'Mustafa Demir',
    companyName: 'Demir Mimarlık A.Ş.',
    email: 'mustafa@demirmimarlik.com',
    phone: '0532 999 88 77',
    address: 'Beşiktaş, İstanbul',
    type: 'Alıcı',
    balance: 0,
    status: 'Aktif',
    isLead: true,
    leadStatus: 'Yeni'
  },
  {
    id: 'LEAD-002',
    customerType: 'Tüzel',
    name: 'Selin Kaya',
    companyName: 'Kaya Lojistik',
    email: 'selin@kayalojistik.com',
    phone: '0555 444 33 22',
    address: 'Kadıköy, İstanbul',
    type: 'Alıcı',
    balance: 0,
    status: 'Aktif',
    isLead: true,
    leadStatus: 'Görüşülüyor'
  }
];
let globalUsers = [...MOCK_USERS];
let globalProducts = [...MOCK_PRODUCTS];
let globalTransactions = [...MOCK_TRANSACTIONS];
let globalCashTransactions = [...MOCK_CASH_TRANSACTIONS];
let globalBankAccounts: BankAccount[] = [
  { id: 'BANK-1', bankName: 'Garanti BBVA', accountName: 'Ana Hesap', iban: 'TR12 3456 7890 1234 5678 90', balance: 150000 },
  { id: 'BANK-2', bankName: 'Yapı Kredi', accountName: 'Kredi Kartı', iban: 'TR98 7654 3210 9876 5432 10', balance: -5000 }
];
let globalPersonnel = [...MOCK_PERSONNEL];
let globalJobApplications: JobApplication[] = [];
let globalServiceTickets: ServiceTicket[] = [];
let globalReminderNotes: ReminderNote[] = [];
let globalNotifications: AppNotification[] = [];
let globalAttendance: AttendanceRecord[] = [
  { id: 'att-1', personnelId: 'p1', date: '2026-06-01', status: 'Geldi', overtimeHours: 2 },
  { id: 'att-2', personnelId: 'p1', date: '2026-06-02', status: 'Geldi', overtimeHours: 0 },
  { id: 'att-3', personnelId: 'p1', date: '2026-06-03', status: 'Geldi', overtimeHours: 0 },
  { id: 'att-4', personnelId: 'p1', date: '2026-06-04', status: 'İzinli', overtimeHours: 0 },
  { id: 'att-5', personnelId: 'p1', date: '2026-06-05', status: 'Geldi', overtimeHours: 1 }
];
let globalSalaryAdjustments: SalaryAdjustment[] = [
  { id: 'adj-1', personnelId: 'p1', date: '2026-06-10', type: 'Avans', amount: 1000, description: 'Nakit Avans' },
  { id: 'adj-2', personnelId: 'p1', date: '2026-06-15', type: 'Prim', amount: 500, description: 'Performans Primi' }
];
let globalPersonnelTasks: PersonnelTask[] = [
  { id: 'tsk-1', personnelId: 'p1', title: 'Müşteri Görüşmesi', description: 'A firması ile toplantı.', status: 'Devam Ediyor', dueDate: '2026-06-26', createdAt: '2026-06-25', priority: 'Yüksek' }
];
let globalPersonnelKPIs: PersonnelKPI[] = [
  { id: 'kpi-1', personnelId: 'p1', month: '2026-06', targetSalesAmount: 500000, actualSalesAmount: 350000, targetNewLeads: 20, actualNewLeads: 12 }
];
let globalMeetingNotes: MeetingNote[] = [];
let globalChequeNotes: any[] = [];

let globalCampaigns: Campaign[] = [
  {
    id: 'CAMP-001',
    name: 'Yaz Başlangıcı İndirimi',
    description: 'Tüm perakende müşterilerinde geçerli %15 net iskonto.',
    customerGroup: 'Perakende',
    discountPercentage: 15,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    isActive: true
  },
  {
    id: 'CAMP-002',
    name: 'B2B Bayi Destek Kampanyası',
    description: 'Toptan alımlarda geçerli özel bayi iskontosu.',
    customerGroup: 'B2B',
    discountPercentage: 25,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true
  }
];
export interface SuspendedCart {
  id: string;
  name: string;
  date: string;
  items: { product: Product; quantity: number; discount: number }[];
  customerId: string;
}
let globalSuspendedCarts: SuspendedCart[] = [];
export interface Waybill {
  id: string;
  supplierId: string;
  documentNo: string;
  date: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
}
let globalWaybills: Waybill[] = [];
let globalProposals: Proposal[] = [
  {
    id: 'TEK-2023-001',
    customerId: '1',
    customerName: 'Ahmet Yılmaz',
    date: '2023-10-26 10:00',
    validUntil: '2023-11-26 10:00',
    subTotal: 1000,
    discountTotal: 0,
    taxTotal: 200,
    total: 1200,
    status: ProposalStatus.PENDING,
    items: [
      { productId: '1', productName: 'Kablosuz Kulaklık', quantity: 1, price: 1000, discountRate: 0 }
    ],
    notes: 'Ürün garanti kapsamındadır.'
  }
];
export interface EInvoice {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  type: string;
  invoiceType?: string;
  scenario: string;
  date: string;
  status: 'Taslak' | 'Gönderildi' | 'Hatalı' | 'Bekliyor' | 'Onaylandı' | 'Reddedildi';
  currency?: string;
  exchangeRate?: number;
  exceptionCode?: string;
}
let globalEInvoices: EInvoice[] = [];
let globalOrders: Order[] = [
  {
    id: 'SIP-2023-001',
    customerId: '1',
    customerName: 'Ahmet Yılmaz',
    date: '2023-10-25 14:30',
    total: 2500.00,
    status: OrderStatus.COMPLETED,
    items: [
      { productId: '1', productName: 'Kablosuz Kulaklık', quantity: 2, price: 1250.00 }
    ]
  }
];

let globalBoms: BOM[] = [
  {
    id: 'BOM-1001',
    name: 'Endüstriyel Sensör V1 Montajı',
    targetProductId: '1',
    items: [{ productId: '2', quantity: 1, unit: 'Adet' }],
    isActive: true,
    estimatedTimeMinutes: 120
  }
];
let globalWorkOrders: WorkOrder[] = [
  {
    id: 'WO-10001',
    bomId: 'BOM-1001',
    targetProductId: '1',
    plannedQuantity: 10,
    producedQuantity: 0,
    status: 'Planlandı',
    priority: 'Yüksek'
  }
];

let globalPurchaseRequests: any[] = [];
let globalDocuments: any[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}


// Use this for all API requests to pass the tenant context
async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
  const headers = new Headers(init?.headers || {});
  headers.set('x-tenant-id', tenantId);
  return fetch(input, { ...init, headers });
}

async function syncArray(table: string, oldArray: any[], newArray: any[]) {
  try {
    const oldIds = new Set(oldArray.map(x => x.id));
    const newIds = new Set(newArray.map(x => x.id));
    
    // Deletes
    for (const item of oldArray) {
      if (!newIds.has(item.id)) {
        apiFetch(`/api/${table}/${item.id}`, { method: 'DELETE' }).catch(console.error);
      }
    }
    
    // Inserts and Updates
    for (const item of newArray) {
      if (!oldIds.has(item.id)) {
        apiFetch(`/api/${table}`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(item) 
        }).catch(console.error);
      } else {
        const oldItem = oldArray.find(x => x.id === item.id);
        if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
          apiFetch(`/api/${table}/${item.id}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(item) 
          }).catch(console.error);
        }
      }
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncObject(table: string, oldObj: any, newObj: any) {
  try {
     if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
         apiFetch(`/api/${table}/1`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newObj)
         }).catch(console.error);
     }
  } catch (err) {
    console.error("Sync object error:", err);
  }
}

let isInitialized = false;
export async function initializeStore() {
  if (isInitialized) return;
  isInitialized = true;
  try {
    const tables = [
      { name: 'users', ref: (data: any) => { globalUsers = data; } },
      { name: 'settings', ref: (data: any) => { 
        if(data.length > 0) {
          const setting = data[0];
          globalSettings = {
            ...setting,
            plumbingChecklistTemplate: typeof setting.plumbingChecklistTemplate === 'string' ? JSON.parse(setting.plumbingChecklistTemplate) : (setting.plumbingChecklistTemplate || ['Filtre Kontrolü', 'Boru Sızıntı Kontrolü', 'Su Basıncı Testi', 'Vana Kontrolü', 'Ekipman Temizliği'])
          };
        } 
      } },
      { name: 'customers', ref: (data: any) => { globalCustomers = data.map((d: any) => ({ ...d, balance: Number(d.balance) || 0 })); } },
      { name: 'products', ref: (data: any) => { globalProducts = data.map((d:any)=>({...d, showInQuickSale: !!d.showInQuickSale, warehouseStocks: typeof d.warehouseStocks === 'string' ? JSON.parse(d.warehouseStocks): (d.warehouseStocks||[])})); } },
      { name: 'categories', ref: (data: any) => { /* already in another branch but if we migrate.. */ } },
      { name: 'brands', ref: (data: any) => { /* ... */ } },
      { name: 'warehouses', ref: (data: any) => { /* ... */ } },
      { name: 'customer_transactions', ref: (data: any) => { globalTransactions = data.map((d: any) => ({ ...d, amount: Number(d.amount) || 0 })); } },
      { name: 'cash_transactions', ref: (data: any) => { globalCashTransactions = data.map((d: any) => ({ ...d, amount: Number(d.amount) || 0 })); } },
      { name: 'boms', ref: (data: any) => { 
        globalBoms = data.map((d: any) => ({
           ...d,
           items: typeof d.items === 'string' ? JSON.parse(d.items) : (d.items || []),
           isActive: d.isActive == 1 || d.isActive === true
        })); 
      } },
      { name: 'work_orders', ref: (data: any) => { globalWorkOrders = data; } },
      { name: 'bank_accounts', ref: (data: any) => { globalBankAccounts = data.map((b: any) => ({ ...b, balance: Number(b.balance) || 0 })); } },
      { name: 'personnel', ref: (data: any) => { globalPersonnel = data; } },
      { name: 'job_applications', ref: (data: any) => { globalJobApplications = data; } },
      { name: 'attendance', ref: (data: any) => { globalAttendance = data; } },
      { name: 'salary_adjustments', ref: (data: any) => { globalSalaryAdjustments = data; } },
      { name: 'personnel_tasks', ref: (data: any) => { globalPersonnelTasks = data; } },
      { name: 'documents', ref: (data: any) => {
        globalDocuments = data.map((d: any) => ({
          ...d,
          tags: typeof d.tags === 'string' ? JSON.parse(d.tags) : (d.tags || [])
        }));
      } },
      { name: 'orders', ref: (data: any) => { 
        globalOrders = data.map((d:any)=>{
           const parsedItems = typeof d.items === 'string' ? JSON.parse(d.items): (d.items||[]);
           const fixedItems = parsedItems.map((i: any) => ({
               ...i, 
               price: i.price !== undefined ? i.price : (i.unitPrice || 0)
           }));
           return { ...d, items: fixedItems, total: d.total !== undefined ? d.total : (d.totalAmount || 0) };
        }); 
      } },
      { name: 'proposals', ref: (data: any) => { 
        globalProposals = data.map((d:any)=>{
           const parsedItems = typeof d.items === 'string' ? JSON.parse(d.items): (d.items||[]);
           const fixedItems = parsedItems.map((i: any) => ({
               ...i, 
               price: i.price !== undefined ? i.price : (i.unitPrice || 0)
           }));
           return { ...d, items: fixedItems, total: d.total !== undefined ? d.total : (d.totalAmount || 0) };
        }); 
      } },
      { name: 'e_invoices', ref: (data: any) => {
        globalEInvoices = data;
      } },
      { name: 'service_tickets', ref: (data: any) => {
        globalServiceTickets = data.map((d:any) => ({
            ...d,
            materialsUsed: typeof d.materialsUsed === 'string' ? JSON.parse(d.materialsUsed) : (d.materialsUsed || []),
            plumbingChecklist: typeof d.plumbingChecklist === 'string' ? JSON.parse(d.plumbingChecklist) : (d.plumbingChecklist || [])
        }));
      } },
      { name: 'reminder_notes', ref: (data: any) => {
        globalReminderNotes = data.map((d:any) => ({
            ...d,
            isCompleted: d.isCompleted == 1 || d.isCompleted === true
        }));
      } },
      { name: 'notifications', ref: (data: any) => {
          globalNotifications = data.map((d: any) => ({
              ...d,
              isRead: d.isRead == 1 || d.isRead === true
          }));
      } },
      { name: 'campaigns', ref: (data: any) => {
          globalCampaigns = data.map((d: any) => ({
              ...d,
              isActive: d.isActive == 1 || d.isActive === true
          }));
      } },
      { name: 'waybills', ref: (data: any) => {
          globalWaybills = data.map((d: any) => ({
            ...d,
            items: typeof d.items === 'string' ? JSON.parse(d.items) : (d.items || [])
          }));
      } },
      { name: 'meeting_notes', ref: (data: any) => {
          globalMeetingNotes = data;
      } }
    ];
    
    for (const t of tables) {
      const res = await apiFetch(`/api/${t.name}`);
      if (res.ok) {
         const data = await res.json();
         if (t.name === 'settings') {
           if (data && data.length > 0) t.ref(data);
         } else {
           t.ref(data || []);
         }
      }
    }
    emit();
  } catch (e) {
    console.error("Failed to initialize store", e);
  }
}

export const useAppStore = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    get users() { return globalUsers; },
    setUsers(updater: any) {
      const old = [...globalUsers];
      globalUsers = typeof updater === 'function' ? updater(globalUsers) : updater;
      syncArray('users', old, globalUsers);
      emit();
    },
    get customers() { return globalCustomers; },
    setCustomers(updater: any) {
      const old = [...globalCustomers];
      globalCustomers = typeof updater === 'function' ? updater(globalCustomers) : updater;
      syncArray('customers', old, globalCustomers);
      emit();
    },
    get products() { return globalProducts; },
    setProducts(updater: any) {
      const old = [...globalProducts];
      globalProducts = typeof updater === 'function' ? updater(globalProducts) : updater;
      syncArray('products', old, globalProducts);
      emit();
    },
    get transactions() { return globalTransactions; },
    setTransactions(updater: any) {
      const old = [...globalTransactions];
      globalTransactions = typeof updater === 'function' ? updater(globalTransactions) : updater;
      syncArray('customer_transactions', old, globalTransactions);
      emit();
    },
    get cashTransactions() { return globalCashTransactions; },
    setCashTransactions(updater: any) {
      const old = [...globalCashTransactions];
      globalCashTransactions = typeof updater === 'function' ? updater(globalCashTransactions) : updater;
      syncArray('cash_transactions', old, globalCashTransactions);
      emit();
    },
    get bankAccounts() { return globalBankAccounts; },
    setBankAccounts(updater: any) {
      const old = [...globalBankAccounts];
      globalBankAccounts = typeof updater === 'function' ? updater(globalBankAccounts) : updater;
      syncArray('bank_accounts', old, globalBankAccounts);
      emit();
    },
    get personnel() { return globalPersonnel; },
    setPersonnel(updater: any) {
      const old = [...globalPersonnel];
      globalPersonnel = typeof updater === 'function' ? updater(globalPersonnel) : updater;
      syncArray('personnel', old, globalPersonnel);
      emit();
    },
    get jobApplications() { return globalJobApplications; },
    setJobApplications(updater: any) {
      const old = [...globalJobApplications];
      globalJobApplications = typeof updater === 'function' ? updater(globalJobApplications) : updater;
      syncArray('job_applications', old, globalJobApplications);
      emit();
    },
    get orders() { return globalOrders; },
    setOrders(updater: any) {
      const old = [...globalOrders];
      globalOrders = typeof updater === 'function' ? updater(globalOrders) : updater;
      syncArray('orders', old, globalOrders);
      emit();
    },
    get proposals() { return globalProposals; },
    setProposals(updater: any) {
      const old = [...globalProposals];
      globalProposals = typeof updater === 'function' ? updater(globalProposals) : updater;
      syncArray('proposals', old, globalProposals);
      emit();
    },
    get eInvoices() { return globalEInvoices; },
    setEInvoices(updater: any) {
      const old = [...globalEInvoices];
      globalEInvoices = typeof updater === 'function' ? updater(globalEInvoices) : updater;
      syncArray('e_invoices', old, globalEInvoices);
      emit();
    },
    get settings() { return globalSettings; },
    setSettings(updater: Settings | ((prev: Settings) => Settings)) {
      const old = globalSettings;
      globalSettings = typeof updater === 'function' ? updater(globalSettings) : updater;
      syncObject('settings', old, globalSettings);
      emit();
    },
    get serviceTickets() { return globalServiceTickets; },
    setServiceTickets(updater: any) {
      const old = [...globalServiceTickets];
      globalServiceTickets = typeof updater === 'function' ? updater(globalServiceTickets) : updater;
      syncArray('service_tickets', old, globalServiceTickets);
      emit();
    },
    get reminderNotes() { return globalReminderNotes; },
    setReminderNotes(updater: any) {
      const old = [...globalReminderNotes];
      globalReminderNotes = typeof updater === 'function' ? updater(globalReminderNotes) : updater;
      syncArray('reminder_notes', old, globalReminderNotes);
      emit();
    },
    get notifications() { return globalNotifications; },
    setNotifications(updater: any) {
      const old = [...globalNotifications];
      globalNotifications = typeof updater === 'function' ? updater(globalNotifications) : updater;
      syncArray('notifications', old, globalNotifications);
      emit();
    },
    get boms() { return globalBoms; },
    setBoms(updater: any) {
      const old = [...globalBoms];
      globalBoms = typeof updater === 'function' ? updater(globalBoms) : updater;
      syncArray('boms', old, globalBoms);
      emit();
    },
    get workOrders() { return globalWorkOrders; },
    setWorkOrders(updater: any) {
      const old = [...globalWorkOrders];
      globalWorkOrders = typeof updater === 'function' ? updater(globalWorkOrders) : updater;
      syncArray('work_orders', old, globalWorkOrders);
      emit();
    },
    get suspendedCarts() { return globalSuspendedCarts; },
    setSuspendedCarts(updater: any) {
      globalSuspendedCarts = typeof updater === 'function' ? updater(globalSuspendedCarts) : updater;
      emit();
    },
    get attendance() { return globalAttendance; },
    setAttendance(updater: any) {
      const old = [...globalAttendance];
      globalAttendance = typeof updater === 'function' ? updater(globalAttendance) : updater;
      syncArray('attendance', old, globalAttendance);
      emit();
    },
    get salaryAdjustments() { return globalSalaryAdjustments; },
    setSalaryAdjustments(updater: any) {
      const old = [...globalSalaryAdjustments];
      globalSalaryAdjustments = typeof updater === 'function' ? updater(globalSalaryAdjustments) : updater;
      syncArray('salary_adjustments', old, globalSalaryAdjustments);
      emit();
    },
    get personnelTasks() { return globalPersonnelTasks; },
    setPersonnelTasks(updater: any) {
      const old = [...globalPersonnelTasks];
      globalPersonnelTasks = typeof updater === 'function' ? updater(globalPersonnelTasks) : updater;
      syncArray('personnel_tasks', old, globalPersonnelTasks);
      emit();
    },
    get personnelKPIs() { return globalPersonnelKPIs; },
    setPersonnelKPIs(updater: any) {
      globalPersonnelKPIs = typeof updater === 'function' ? updater(globalPersonnelKPIs) : updater;
      emit();
    },
    get meetingNotes() { return globalMeetingNotes; },
    setMeetingNotes(updater: any) {
      const old = [...globalMeetingNotes];
      globalMeetingNotes = typeof updater === 'function' ? updater(globalMeetingNotes) : updater;
      syncArray('meeting_notes', old, globalMeetingNotes);
      emit();
    },
    get campaigns() { return globalCampaigns; },
    setCampaigns(updater: any) {
      const old = [...globalCampaigns];
      globalCampaigns = typeof updater === 'function' ? updater(globalCampaigns) : updater;
      syncArray('campaigns', old, globalCampaigns);
      emit();
    },
    get purchaseRequests() { return globalPurchaseRequests; },
    setPurchaseRequests(updater: any) {
      const old = [...globalPurchaseRequests];
      globalPurchaseRequests = typeof updater === 'function' ? updater(globalPurchaseRequests) : updater;
      syncArray('purchase_requests', old, globalPurchaseRequests);
      emit();
    },
    get documents() { return globalDocuments; },
    setDocuments(updater: any) {
      const old = [...globalDocuments];
      globalDocuments = typeof updater === 'function' ? updater(globalDocuments) : updater;
      syncArray('documents', old, globalDocuments);
      emit();
    },
    get chequeNotes() { return globalChequeNotes; },
    setChequeNotes(updater: any) {
      const old = [...globalChequeNotes];
      globalChequeNotes = typeof updater === 'function' ? updater(globalChequeNotes) : updater;
      syncArray('cheque_notes', old, globalChequeNotes);
      emit();
    },
    get waybills() { return globalWaybills; },
    setWaybills(updater: any) {
      const old = [...globalWaybills];
      globalWaybills = typeof updater === 'function' ? updater(globalWaybills) : updater;
      syncArray('waybills', old, globalWaybills);
      emit();
    }
  };
};
