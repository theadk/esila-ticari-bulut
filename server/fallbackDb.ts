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
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
}

export function getFallbackTable(table: string, vkn?: string) {
  if (!dbData[table]) dbData[table] = [];
  if (vkn) {
     return dbData[table].filter(r => r.vkn === vkn || vkn === '1111111111' || !r.vkn);
  }
  return dbData[table];
}

export function insertFallbackRow(table: string, row: any) {
  if (!dbData[table]) dbData[table] = [];
  dbData[table].push(row);
  save();
  return row;
}

export function updateFallbackRow(table: string, id: string, vkn: string, updates: any) {
  if (!dbData[table]) dbData[table] = [];
  const index = dbData[table].findIndex(r => (String(r.id) === String(id) || String(r.vkn) === String(id)) && (r.vkn === vkn || vkn === '1111111111' || !r.vkn));
  if (index !== -1) {
    dbData[table][index] = { ...dbData[table][index], ...updates };
    save();
    return dbData[table][index];
  }
  return null;
}

export function deleteFallbackRow(table: string, id: string, vkn: string) {
  if (!dbData[table]) dbData[table] = [];
  const index = dbData[table].findIndex(r => (String(r.id) === String(id) || String(r.vkn) === String(id)) && (r.vkn === vkn || vkn === '1111111111' || !r.vkn));
  if (index !== -1) {
    dbData[table].splice(index, 1);
    save();
    return true;
  }
  return false;
}
