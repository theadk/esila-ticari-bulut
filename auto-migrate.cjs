const mysql = require('mysql2/promise');
require('dotenv').config();

const schemas = {
  customers: {
    customerType: 'VARCHAR(50)',
    city: 'VARCHAR(255)',
    district: 'VARCHAR(255)',
    iban: 'VARCHAR(255)',
    balance: 'DECIMAL(15,2) DEFAULT 0',
    status: 'VARCHAR(50) DEFAULT "Aktif"',
    efaturaType: 'VARCHAR(100)',
    efaturaScenario: 'VARCHAR(100)',
    efaturaInvoiceType: 'VARCHAR(100)',
    assignedUser: 'VARCHAR(255)'
  },
  products: {
    unit: 'VARCHAR(50)',
    subCategory: 'VARCHAR(255)',
    image: 'TEXT',
    variants: 'JSON'
  },
  orders: {
    subTotal: 'DECIMAL(15,2)',
    taxTotal: 'DECIMAL(15,2)',
    currency: 'VARCHAR(50)',
    exchangeRate: 'DECIMAL(10,4)',
    proposalId: 'VARCHAR(255)',
    notes: 'TEXT'
  },
  proposals: {
    notes: 'TEXT'
  },
  cash_transactions: {
    categoryId: 'VARCHAR(100)',
    category: 'VARCHAR(255)',
    customerId: 'VARCHAR(255)',
    personnelId: 'VARCHAR(255)'
  },
  personnel: {
    gender: 'VARCHAR(20)',
    bloodType: 'VARCHAR(10)',
    emergencyContactName: 'VARCHAR(255)',
    emergencyContactPhone: 'VARCHAR(50)',
    endDate: 'DATE',
    iban: 'VARCHAR(255)',
    socialSecurityNo: 'VARCHAR(255)',
    currency: 'VARCHAR(50)',
    annualLeaveEntitlement: 'INT DEFAULT 14',
    records: 'JSON',
    payrolls: 'JSON',
    fixtures: 'JSON',
    leaveRecords: 'JSON'
  },
  job_applications: {
    firstName: 'VARCHAR(255)',
    lastName: 'VARCHAR(255)',
    email: 'VARCHAR(255)',
    phone: 'VARCHAR(50)',
    positionApplied: 'VARCHAR(255)',
    applicationDate: 'DATETIME',
    status: 'VARCHAR(50)',
    resumeUrl: 'TEXT',
    notes: 'TEXT'
  },
  service_tickets: {
    customerId: 'VARCHAR(255)',
    deviceModel: 'VARCHAR(255)',
    deviceSerial: 'VARCHAR(255)',
    issueDescription: 'TEXT',
    status: 'VARCHAR(50)',
    priority: 'VARCHAR(50)',
    createdAt: 'DATETIME',
    updatedAt: 'DATETIME',
    assignedTo: 'VARCHAR(255)',
    resolutionNotes: 'TEXT',
    partsCost: 'DECIMAL(15,2)',
    laborCost: 'DECIMAL(15,2)',
    totalCost: 'DECIMAL(15,2)',
    materialsUsed: 'JSON',
    systemType: 'VARCHAR(100)',
    brand: 'VARCHAR(100)',
    warrantyStatus: 'VARCHAR(50)',
    estimatedCompletion: 'DATETIME',
    signatureUrl: 'TEXT',
    plumbingChecklist: 'JSON'
  },
  reminder_notes: {
    title: 'VARCHAR(255)',
    description: 'TEXT',
    reminderDate: 'DATETIME',
    isCompleted: 'TINYINT(1) DEFAULT 0',
    color: 'VARCHAR(50)',
    createdAt: 'DATETIME',
    createdBy: 'VARCHAR(255)',
    relatedToType: 'VARCHAR(50)',
    relatedToId: 'VARCHAR(255)'
  }
};

async function migrate() {
  const fd = require('fs').readFileSync('.env', 'utf-8');
  let url = fd.match(/DATABASE_URL="(.*)"/)[1];
  const pool = mysql.createPool(url);
  for (const [table, cols] of Object.entries(schemas)) {
    try {
      const [tableCols] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
      const existing = tableCols.map(c => c.Field);
      for (const [col, type] of Object.entries(cols)) {
        if (!existing.includes(col)) {
          console.log(`Adding ${col} to ${table}...`);
          await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${type}`);
        }
      }
    } catch (e) {
      console.error(`Error on ${table}:`, e.message);
    }
  }
  process.exit();
}
migrate();
