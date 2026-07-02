import { useState, useEffect } from 'react';
import { Customer, CustomerTransaction, CashTransaction, Personnel, Order, OrderStatus, Proposal, ProposalStatus, Settings, Product, User, ServiceTicket, JobApplication, ReminderNote, BOM, WorkOrder, AppNotification, AttendanceRecord, SalaryAdjustment, PersonnelKPI, PersonnelTask, MeetingNote, Campaign } from '../types';

const safeJSONParse = (val: any, defaultVal: any = []) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch(e) { return defaultVal; }
  }
  return val || defaultVal;
};

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

let globalCustomers: Customer[] = [];
let globalUsers: User[] = [];
let globalProducts: Product[] = [];
let globalTransactions: CustomerTransaction[] = [];
let globalCashTransactions: CashTransaction[] = [];
let globalBankAccounts: BankAccount[] = [];
let globalPersonnel: Personnel[] = [];
let globalJobApplications: JobApplication[] = [];
let globalServiceTickets: ServiceTicket[] = [];
let globalReminderNotes: ReminderNote[] = [];
let globalNotifications: AppNotification[] = [];
let globalAttendance: AttendanceRecord[] = [];
let globalSalaryAdjustments: SalaryAdjustment[] = [];
let globalPersonnelTasks: PersonnelTask[] = [];
let globalPersonnelKPIs: PersonnelKPI[] = [];
let globalMeetingNotes: MeetingNote[] = [];
let globalChequeNotes: any[] = [];

let globalCampaigns: Campaign[] = [];
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
let globalProposals: Proposal[] = [];
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
let globalOrders: Order[] = [];

let globalBoms: BOM[] = [];
let globalWorkOrders: WorkOrder[] = [];

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
  const tenantId = sessionStorage.getItem('esila_tenant_id') || '1111111111';
  const userId = sessionStorage.getItem('esila_user_id') || '';
  const headers = new Headers(init?.headers || {});
  headers.set('x-tenant-id', tenantId);
  if (userId) {
    headers.set('x-user-id', userId);
  }
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  
  const response = await fetch(input, { ...init, headers, cache: 'no-store' });
  
  // Debugging layer for API responses
  try {
    const clonedResponse = response.clone();
    const method = init?.method || 'GET';
    const url = typeof input === 'string' ? input : input.url;
    
    if (method !== 'GET') {
      console.log(`[API REQUEST] ${method} ${url}`);
      
      if (!clonedResponse.ok) {
        const errorText = await clonedResponse.text();
        console.error(`[API ERROR] ${method} ${url} - Status: ${clonedResponse.status}`, errorText);
        if (init?.body) {
           console.error(`[API ERROR PAYLOAD]`, init.body);
        }
      } else {
        const data = await clonedResponse.json();
        console.log(`[API SUCCESS] ${method} ${url} - Status: ${clonedResponse.status}`, data);
      }
    }
  } catch (err) {
    console.error("[API DEBUG ERROR]", err);
  }
  
  return response;
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
export async function initializeStore(force = false) {
  if (isInitialized && !force) return;
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
      { name: 'products', ref: (data: any) => { globalProducts = data.map((d:any)=>({...d, showInQuickSale: !!d.showInQuickSale, warehouseStocks: safeJSONParse(d.warehouseStocks, [])})); } },
      { name: 'categories', ref: (data: any) => { /* already in another branch but if we migrate.. */ } },
      { name: 'brands', ref: (data: any) => { /* ... */ } },
      { name: 'warehouses', ref: (data: any) => { /* ... */ } },
      { name: 'customer_transactions', ref: (data: any) => { globalTransactions = data.map((d: any) => ({ ...d, amount: Number(d.amount) || 0 })); } },
      { name: 'cash_transactions', ref: (data: any) => { globalCashTransactions = data.map((d: any) => ({ ...d, amount: Number(d.amount) || 0 })); } },
      { name: 'boms', ref: (data: any) => { 
        globalBoms = data.map((d: any) => ({
           ...d,
           items: safeJSONParse(d.items, []),
           isActive: d.isActive == 1 || d.isActive === true
        })); 
      } },
      { name: 'work_orders', ref: (data: any) => { globalWorkOrders = data; } },
      { name: 'bank_accounts', ref: (data: any) => { globalBankAccounts = data.map((b: any) => ({ ...b, balance: Number(b.balance) || 0 })); } },
      { name: 'personnel', ref: (data: any) => { 
        globalPersonnel = data.map((p: any) => ({
          ...p,
          records: safeJSONParse(p.records, []),
          payrollRecords: safeJSONParse(p.payrollRecords, []),
          fixtures: safeJSONParse(p.fixtures, []),
          payrolls: safeJSONParse(p.payrolls, []),
          leaveRecords: safeJSONParse(p.leaveRecords, [])
        })); 
      } },
      { name: 'job_applications', ref: (data: any) => { globalJobApplications = data; } },
      { name: 'attendance', ref: (data: any) => { globalAttendance = data; } },
      { name: 'salary_adjustments', ref: (data: any) => { globalSalaryAdjustments = data; } },
      { name: 'personnel_tasks', ref: (data: any) => { globalPersonnelTasks = data; } },
      { name: 'documents', ref: (data: any) => {
        globalDocuments = data.map((d: any) => ({
          ...d,
          tags: safeJSONParse(d.tags, [])
        }));
      } },
      { name: 'orders', ref: (data: any) => { 
        globalOrders = data.map((d:any)=>{
           const parsedItems = safeJSONParse(d.items, []);
           const fixedItems = parsedItems.map((i: any) => ({
               ...i, 
               price: i.price !== undefined ? i.price : (i.unitPrice || 0)
           }));
           return { ...d, items: fixedItems, total: d.total !== undefined ? d.total : (d.totalAmount || 0) };
        }); 
      } },
      { name: 'proposals', ref: (data: any) => { 
        globalProposals = data.map((d:any)=>{
           const parsedItems = safeJSONParse(d.items, []);
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
            materialsUsed: safeJSONParse(d.materialsUsed, []),
            plumbingChecklist: safeJSONParse(d.plumbingChecklist, [])
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
            items: safeJSONParse(d.items, [])
          }));
      } },
      { name: 'purchase_requests', ref: (data: any) => { 
          globalPurchaseRequests = data.map((d: any) => ({
            ...d,
            items: safeJSONParse(d.items, [])
          }));
      } },
      { name: 'cheque_notes', ref: (data: any) => { globalChequeNotes = data; } },
      { name: 'suspended_carts', ref: (data: any) => { 
          globalSuspendedCarts = data.map((d: any) => ({
             ...d,
             items: safeJSONParse(d.items, [])
          }));
      } },
      { name: 'personnel_kpis', ref: (data: any) => { globalPersonnelKPIs = data; } },
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
      const old = [...globalSuspendedCarts];
      globalSuspendedCarts = typeof updater === 'function' ? updater(globalSuspendedCarts) : updater;
      syncArray('suspended_carts', old, globalSuspendedCarts);
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
      const old = [...globalPersonnelKPIs];
      globalPersonnelKPIs = typeof updater === 'function' ? updater(globalPersonnelKPIs) : updater;
      syncArray('personnel_kpis', old, globalPersonnelKPIs);
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
