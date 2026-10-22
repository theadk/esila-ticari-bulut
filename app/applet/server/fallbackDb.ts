import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local_db.json');

let dbData: Record<string, any[]> = {
  users: [
    { id: 'u1', vkn: '1111111111', name: 'Sistem Yöneticisi', username: 'admin', email: 'admin@esila.com', passwordHash: 'admin123', role: 'Admin', status: 'Aktif' }
  ],
  tenants: [
    { vkn: '1111111111', name: 'Esila Master', email: 'admin@firma.com', modules: ['all'], status: 'Aktif', package: 'Sınırsız', expirationDate: null }
  ],
  settings: [
    { vkn: '1111111111', id: 1, companyName: 'Esila Master', email: 'admin@firma.com' }
  ],
  categories: [
    { vkn: '1111111111', id: '1', name: 'Elektronik', sub_categories: ['Telefon', 'Bilgisayar', 'Aksesuar'] },
    { vkn: '1111111111', id: '2', name: 'Giyim', sub_categories: ['Erkek', 'Kadın', 'Çocuk'] }
  ],
  warehouses: [
    { vkn: '1111111111', id: 'wh-1', name: 'Merkez Depo', capacity: 1000 }
  ],
  brands: [
     { vkn: '1111111111', id: '1', name: 'Sony' },
     { vkn: '1111111111', id: '2', name: 'Apple' },
     { vkn: '1111111111', id: '3', name: 'Samsung' }
  ],
  products: [
    { vkn: '1111111111', id: '1', code: 'PRD-001', name: 'Kablosuz Kulaklık', price: 1250.00, purchasePrice: 900.00, stock: 45, category: 'Elektronik', warehouse: 'Merkez Depo', barcode: '8691234567890', description: 'Gürültü önleyici kulaklık', brand: 'Sony', taxRate: 20, unit: 'Adet' },
    { vkn: '1111111111', id: '2', code: 'PRD-002', name: 'Akıllı Saat', price: 3400.00, purchasePrice: 2800.00, stock: 12, category: 'Elektronik', warehouse: 'Merkez Depo', barcode: '8691234567891', description: 'Nabız ölçerli akıllı saat', brand: 'Apple', taxRate: 20, unit: 'Adet' },
    { vkn: '1111111111', id: '3', code: 'PRD-003', name: 'Laptop Çantası', price: 450.00, purchasePrice: 300.00, stock: 120, category: 'Aksesuar', warehouse: 'Merkez Depo', barcode: '8691234567892', description: 'Su geçirmez çanta', brand: 'Targus', taxRate: 20, unit: 'Adet' },
    { vkn: '1111111111', id: '4', code: 'PRD-004', name: 'USB-C Kablo', price: 150.00, purchasePrice: 90.00, stock: 50, category: 'Aksesuar', warehouse: 'Merkez Depo', barcode: '8691234567893', description: 'Hızlı şarj destekli', brand: 'Anker', taxRate: 20, unit: 'Adet' }
  ]
};

try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    dbData = { ...dbData, ...parsed };
    if (!dbData.products || dbData.products.length === 0) {
      dbData.products = [
        { vkn: '1111111111', id: '1', code: 'PRD-001', name: 'Kablosuz Kulaklık', price: 1250.00, purchasePrice: 900.00, stock: 45, category: 'Elektronik', warehouse: 'Merkez Depo', barcode: '8691234567890', description: 'Gürültü önleyici kulaklık', brand: 'Sony', taxRate: 20, unit: 'Adet' },
        { vkn: '1111111111', id: '2', code: 'PRD-002', name: 'Akıllı Saat', price: 3400.00, purchasePrice: 2800.00, stock: 12, category: 'Elektronik', warehouse: 'Merkez Depo', barcode: '8691234567891', description: 'Nabız ölçerli akıllı saat', brand: 'Apple', taxRate: 20, unit: 'Adet' },
        { vkn: '1111111111', id: '3', code: 'PRD-003', name: 'Laptop Çantası', price: 450.00, purchasePrice: 300.00, stock: 120, category: 'Aksesuar', warehouse: 'Merkez Depo', barcode: '8691234567892', description: 'Su geçirmez çanta', brand: 'Targus', taxRate: 20, unit: 'Adet' },
        { vkn: '1111111111', id: '4', code: 'PRD-004', name: 'USB-C Kablo', price: 150.00, purchasePrice: 90.00, stock: 50, category: 'Aksesuar', warehouse: 'Merkez Depo', barcode: '8691234567893', description: 'Hızlı şarj destekli', brand: 'Anker', taxRate: 20, unit: 'Adet' }
      ];
    }
    save();
  } else {
    save(); // Create initial file
  }
} catch (err) {
  console.error("Error reading local_db.json", err);
}

function save() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  } catch (err) {
    console.error("Error saving local_db.json", err);
  }
}

export function reloadFallbackDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      dbData = { ...dbData, ...parsed };
    }
  } catch (err) {
    console.error("Error reloading local_db.json", err);
  }
}

export function getFallbackTable(table: string, vkn?: string) {
  if (!dbData[table]) dbData[table] = [];
  if (vkn) {
     if (table === 'tenants') return dbData[table];
     return dbData[table].filter(r => r.vkn === vkn);
  }
  return dbData[table];
}

export function insertFallbackRow(table: string, row: any) {
  if (!dbData[table]) dbData[table] = [];
  
  // Ensure vkn is present
  if (!row.vkn) {
    row.vkn = '1111111111';
  }

  // Prevent duplicates
  if (row.id) {
    const existingIndex = dbData[table].findIndex(r => String(r.id) === String(row.id) && String(r.vkn) === String(row.vkn));
    if (existingIndex !== -1) {
      dbData[table][existingIndex] = { ...dbData[table][existingIndex], ...row };
      save();
      return dbData[table][existingIndex];
    }
  }

  dbData[table].push(row);
  save();
  return row;
}

export function updateFallbackRow(table: string, id: string, vkn: string, updates: any) {
  if (!dbData[table]) dbData[table] = [];
  
  if (table === 'tenants') {
     const index = dbData[table].findIndex(r => String(r.vkn) === String(id));
     if (index !== -1) {
       dbData[table][index] = { ...dbData[table][index], ...updates };
       save();
       return dbData[table][index];
     }
     return null;
  }

  const index = dbData[table].findIndex(r => String(r.id) === String(id) && String(r.vkn) === String(vkn));
  if (index !== -1) {
    dbData[table][index] = { ...dbData[table][index], ...updates, id, vkn };
    save();
    return dbData[table][index];
  } else if (table === 'settings') {
    const newRow = { id, vkn, ...updates };
    dbData[table].push(newRow);
    save();
    return newRow;
  } else {
    // If not found, insert as new row to prevent disappearance
    const newRow = { id, vkn, ...updates };
    dbData[table].push(newRow);
    save();
    return newRow;
  }
}

export function deleteFallbackRow(table: string, id: string, vkn: string) {
  if (!dbData[table]) dbData[table] = [];
  
  if (table === 'tenants') {
     const index = dbData[table].findIndex(r => String(r.vkn) === String(id));
     if (index !== -1) {
       dbData[table].splice(index, 1);
       save();
       return true;
     }
     return false;
  }

  const index = dbData[table].findIndex(r => String(r.id) === String(id) && String(r.vkn) === String(vkn));
  if (index !== -1) {
    dbData[table].splice(index, 1);
    save();
    return true;
  }
  return false;
}
