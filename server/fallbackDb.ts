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
  ]
};

try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (parsed && Array.isArray(parsed.tenants) && parsed.tenants.length >= 2) {
      dbData = parsed;
    } else if (fs.existsSync(path.join(process.cwd(), 'backup.json'))) {
      const backupRaw = fs.readFileSync(path.join(process.cwd(), 'backup.json'), 'utf8');
      dbData = JSON.parse(backupRaw);
      save();
    } else {
      dbData = parsed;
    }
  } else if (fs.existsSync(path.join(process.cwd(), 'backup.json'))) {
    const backupRaw = fs.readFileSync(path.join(process.cwd(), 'backup.json'), 'utf8');
    dbData = JSON.parse(backupRaw);
    save();
  } else {
    save();
  }
} catch (err) {
  console.error("Error reading database file", err);
}

function save() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  } catch (err) {
    console.error("Error saving database file", err);
  }
}

export function reloadFallbackDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbData = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reloading database file", err);
  }
}

export function getFallbackTable(table: string, vkn?: string) {
  if (!dbData[table]) dbData[table] = [];
  if (vkn) {
     if (table === 'tenants') return dbData[table];
     return dbData[table].filter(r => String(r.vkn) === String(vkn));
  }
  return dbData[table];
}

export function insertFallbackRow(table: string, row: any) {
  if (!dbData[table]) dbData[table] = [];
  
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
    dbData[table][index] = { ...dbData[table][index], ...updates };
    save();
    return dbData[table][index];
  } else if (table === 'settings') {
    const newRow = { id, vkn, ...updates };
    dbData[table].push(newRow);
    save();
    return newRow;
  }
  return null;
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
