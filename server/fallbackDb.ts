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
  brands: [
     { vkn: '1111111111', id: '1', name: 'Sony' },
     { vkn: '1111111111', id: '2', name: 'Apple' },
     { vkn: '1111111111', id: '3', name: 'Samsung' }
  ]
};

try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    dbData = JSON.parse(data);
  } else {
    save(); // Create initial file
  }
} catch (err) {
  console.error("Error reading local_db.json", err);
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2)); fs.appendFileSync("/tmp/my_log.txt", "Saved to " + DB_FILE + "\n");
}

export function reloadFallbackDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbData = JSON.parse(data);
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
  
  // Prevent duplicates
  if (row.id) {
    const existingIndex = dbData[table].findIndex(r => String(r.id) === String(row.id) && r.vkn === row.vkn);
    if (existingIndex !== -1) {
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

  const index = dbData[table].findIndex(r => String(r.id) === String(id) && r.vkn === vkn);
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

  const index = dbData[table].findIndex(r => String(r.id) === String(id) && r.vkn === vkn);
  if (index !== -1) {
    dbData[table].splice(index, 1);
    save();
    return true;
  }
  return false;
}
