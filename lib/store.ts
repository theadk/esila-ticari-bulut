import { useState, useEffect } from 'react';
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS, MOCK_CASH_TRANSACTIONS, MOCK_PERSONNEL, MOCK_PRODUCTS, MOCK_USERS } from '../mockData';
import { Customer, CustomerTransaction, CashTransaction, Personnel, Order, OrderStatus, Proposal, ProposalStatus, Settings, Product, User } from '../types';

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
};

let globalCustomers = [...MOCK_CUSTOMERS];
let globalUsers = [...MOCK_USERS];
let globalProducts = [...MOCK_PRODUCTS];
let globalTransactions = [...MOCK_TRANSACTIONS];
let globalCashTransactions = [...MOCK_CASH_TRANSACTIONS];
let globalPersonnel = [...MOCK_PERSONNEL];
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

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}


async function syncArray(table: string, oldArray: any[], newArray: any[]) {
  try {
    const oldIds = new Set(oldArray.map(x => x.id));
    const newIds = new Set(newArray.map(x => x.id));
    
    // Deletes
    for (const item of oldArray) {
      if (!newIds.has(item.id)) {
        fetch(`/api/${table}/${item.id}`, { method: 'DELETE' }).catch(console.error);
      }
    }
    
    // Inserts and Updates
    for (const item of newArray) {
      if (!oldIds.has(item.id)) {
        fetch(`/api/${table}`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(item) 
        }).catch(console.error);
      } else {
        const oldItem = oldArray.find(x => x.id === item.id);
        if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
          fetch(`/api/${table}/${item.id}`, { 
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
         fetch(`/api/${table}/1`, {
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
      { name: 'settings', ref: (data: any) => { if(data.length > 0) globalSettings = data[0]; } },
      { name: 'customers', ref: (data: any) => { globalCustomers = data; } },
      { name: 'products', ref: (data: any) => { globalProducts = data.map((d:any)=>({...d, warehouseStocks: typeof d.warehouseStocks === 'string' ? JSON.parse(d.warehouseStocks): (d.warehouseStocks||[])})); } },
      { name: 'categories', ref: (data: any) => { /* already in another branch but if we migrate.. */ } },
      { name: 'brands', ref: (data: any) => { /* ... */ } },
      { name: 'warehouses', ref: (data: any) => { /* ... */ } },
      { name: 'customer_transactions', ref: (data: any) => { globalTransactions = data; } },
      { name: 'cash_transactions', ref: (data: any) => { globalCashTransactions = data; } },
      { name: 'personnel', ref: (data: any) => { globalPersonnel = data; } },
      { name: 'orders', ref: (data: any) => { globalOrders = data.map((d:any)=>({...d, items: typeof d.items === 'string' ? JSON.parse(d.items): (d.items||[])})); } },
      { name: 'proposals', ref: (data: any) => { globalProposals = data.map((d:any)=>({...d, items: typeof d.items === 'string' ? JSON.parse(d.items): (d.items||[])})); } }
    ];
    
    for (const t of tables) {
      const res = await fetch(`/api/${t.name}`);
      if (res.ok) {
         const data = await res.json();
         if (data && data.length > 0) {
            t.ref(data);
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
      const old = globalUsers;
      globalUsers = typeof updater === 'function' ? updater(globalUsers) : updater;
      syncArray('users', old, globalUsers);
      emit();
    },
    get customers() { return globalCustomers; },
    setCustomers(updater: any) {
      const old = globalCustomers;
      globalCustomers = typeof updater === 'function' ? updater(globalCustomers) : updater;
      syncArray('customers', old, globalCustomers);
      emit();
    },
    get products() { return globalProducts; },
    setProducts(updater: any) {
      const old = globalProducts;
      globalProducts = typeof updater === 'function' ? updater(globalProducts) : updater;
      syncArray('products', old, globalProducts);
      emit();
    },
    get transactions() { return globalTransactions; },
    setTransactions(updater: any) {
      const old = globalTransactions;
      globalTransactions = typeof updater === 'function' ? updater(globalTransactions) : updater;
      syncArray('customer_transactions', old, globalTransactions);
      emit();
    },
    get cashTransactions() { return globalCashTransactions; },
    setCashTransactions(updater: any) {
      const old = globalCashTransactions;
      globalCashTransactions = typeof updater === 'function' ? updater(globalCashTransactions) : updater;
      syncArray('cash_transactions', old, globalCashTransactions);
      emit();
    },
    get personnel() { return globalPersonnel; },
    setPersonnel(updater: any) {
      const old = globalPersonnel;
      globalPersonnel = typeof updater === 'function' ? updater(globalPersonnel) : updater;
      syncArray('personnel', old, globalPersonnel);
      emit();
    },
    get orders() { return globalOrders; },
    setOrders(updater: any) {
      const old = globalOrders;
      globalOrders = typeof updater === 'function' ? updater(globalOrders) : updater;
      syncArray('orders', old, globalOrders);
      emit();
    },
    get proposals() { return globalProposals; },
    setProposals(updater: any) {
      const old = globalProposals;
      globalProposals = typeof updater === 'function' ? updater(globalProposals) : updater;
      syncArray('proposals', old, globalProposals);
      emit();
    },
    get settings() { return globalSettings; },
    setSettings(updater: Settings | ((prev: Settings) => Settings)) {
      globalSettings = typeof updater === 'function' ? updater(globalSettings) : updater;
      emit();
    }
  };
};
