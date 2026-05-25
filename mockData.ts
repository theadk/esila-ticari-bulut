import { Product, Customer, CustomerTransaction, CashTransaction, Personnel, User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sistem Yöneticisi',
    username: 'admin',
    email: 'admin@esila.com',
    passwordHash: 'admin123', // In a real app this would be hashed
    role: 'Admin',
    status: 'Aktif'
  }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: 'PRD-001', name: 'Kablosuz Kulaklık', price: 1250.00, stock: 45, category: 'Elektronik', warehouse: 'Ana Depo', barcode: '8691234567890', showInQuickSale: true },
  { id: '2', code: 'PRD-002', name: 'Akıllı Saat', price: 3400.00, stock: 12, category: 'Elektronik', warehouse: 'Şube Depo', barcode: '8691234567891', showInQuickSale: true },
  { id: '3', code: 'PRD-003', name: 'Laptop Çantası', price: 450.00, stock: 120, category: 'Aksesuar', warehouse: 'Ana Depo', barcode: '8691234567892', showInQuickSale: true },
  { id: '4', code: 'PRD-004', name: 'USB-C Kablo', price: 150.00, stock: 0, category: 'Aksesuar', warehouse: 'Ana Depo', barcode: '8691234567893', showInQuickSale: false },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', customerType: 'Şahıs', name: 'Ahmet Yılmaz', companyName: 'Yılmaz Ticaret', type: 'Alıcı', email: 'ahmet@mail.com', phone: '0555 123 45 67', address: 'İstanbul, Kadıköy', balance: 1500, status: 'Aktif' },
  { id: '2', customerType: 'Tüzel', name: 'Ayşe Demir', companyName: 'Demir Ticaret A.Ş.', type: 'Satıcı', email: 'ayse@mail.com', phone: '0532 987 65 43', address: 'Ankara, Çankaya', balance: -500, status: 'Aktif' },
  { id: '3', customerType: 'Şahıs', name: 'Mehmet Kaya', companyName: '', type: 'Alıcı', email: 'mehmet@mail.com', phone: '0544 333 22 11', address: 'İzmir, Karşıyaka', balance: 0, status: 'Aktif' },
];

export const MOCK_TRANSACTIONS: CustomerTransaction[] = [
  { id: 't1', customerId: '1', date: '2026-05-01', type: 'Satış', amount: 3500, description: 'Toptan Malzeme' },
  { id: 't2', customerId: '1', date: '2026-05-05', type: 'Tahsilat', amount: -2000, description: 'Nakit Tahsilat' },
  { id: 't3', customerId: '2', date: '2026-04-20', type: 'Alış', amount: -500, description: 'Hammadde Alımı' },
];

export const MOCK_CASH_TRANSACTIONS: CashTransaction[] = [
  { id: 'c1', date: '2026-05-05', type: 'Gelir', category: 'Cari Tahsilat', amount: 2000, description: 'Nakit Tahsilat (Ahmet Yılmaz)', customerId: '1' },
];

export const MOCK_PERSONNEL: Personnel[] = [
  {
    id: 'p1',
    firstName: 'Ali',
    lastName: 'Veli',
    tcNo: '12345678901',
    birthDate: '1990-01-01',
    gender: 'Erkek',
    bloodType: 'A+',
    phone: '0555 111 22 33',
    email: 'ali.veli@sirket.com',
    address: 'İstanbul, Beşiktaş',
    emergencyContactName: 'Ayşe Veli',
    emergencyContactPhone: '0532 222 33 44',
    department: 'Satış',
    position: 'Satış Temsilcisi',
    startDate: '2022-03-15',
    employmentStatus: 'Aktif',
    salary: 25000,
    iban: 'TR123456789012345678901234',
    socialSecurityNo: '123456789',
    records: [
      {
        id: 'r1',
        targetId: 'doc1',
        date: '2022-03-15',
        type: 'Belge',
        title: 'İş Sözleşmesi',
        description: 'İmzalı iş sözleşmesi dosyası',
        documentUrl: 'data:text/plain;base64,VGhpcyBpcyBhIHRlc3QgZG9jdW1lbnQ=',
        documentName: 'is_sozlesmesi.pdf'
      }
    ]
  }
];
