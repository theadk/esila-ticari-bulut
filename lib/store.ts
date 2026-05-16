import { useState, useEffect } from 'react';
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS, MOCK_CASH_TRANSACTIONS, MOCK_PERSONNEL, MOCK_PRODUCTS } from '../mockData';
import { Customer, CustomerTransaction, CashTransaction, Personnel, Order, OrderStatus, Proposal, ProposalStatus, Settings, Product } from '../types';

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
  printer_footer_text: 'Bizi tercih ettiğiniz için teşekkürler!'
};

let globalCustomers = [...MOCK_CUSTOMERS];
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

export const useAppStore = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    get customers() { return globalCustomers; },
    setCustomers(updater: Customer[] | ((prev: Customer[]) => Customer[])) {
      globalCustomers = typeof updater === 'function' ? updater(globalCustomers) : updater;
      emit();
    },
    get products() { return globalProducts; },
    setProducts(updater: Product[] | ((prev: Product[]) => Product[])) {
      globalProducts = typeof updater === 'function' ? updater(globalProducts) : updater;
      emit();
    },
    get transactions() { return globalTransactions; },
    setTransactions(updater: CustomerTransaction[] | ((prev: CustomerTransaction[]) => CustomerTransaction[])) {
      globalTransactions = typeof updater === 'function' ? updater(globalTransactions) : updater;
      emit();
    },
    get cashTransactions() { return globalCashTransactions; },
    setCashTransactions(updater: CashTransaction[] | ((prev: CashTransaction[]) => CashTransaction[])) {
      globalCashTransactions = typeof updater === 'function' ? updater(globalCashTransactions) : updater;
      emit();
    },
    get personnel() { return globalPersonnel; },
    setPersonnel(updater: Personnel[] | ((prev: Personnel[]) => Personnel[])) {
      globalPersonnel = typeof updater === 'function' ? updater(globalPersonnel) : updater;
      emit();
    },
    get orders() { return globalOrders; },
    setOrders(updater: Order[] | ((prev: Order[]) => Order[])) {
      globalOrders = typeof updater === 'function' ? updater(globalOrders) : updater;
      emit();
    },
    get proposals() { return globalProposals; },
    setProposals(updater: Proposal[] | ((prev: Proposal[]) => Proposal[])) {
      globalProposals = typeof updater === 'function' ? updater(globalProposals) : updater;
      emit();
    },
    get settings() { return globalSettings; },
    setSettings(updater: Settings | ((prev: Settings) => Settings)) {
      globalSettings = typeof updater === 'function' ? updater(globalSettings) : updater;
      emit();
    }
  };
};
