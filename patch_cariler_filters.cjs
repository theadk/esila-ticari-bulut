const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// Add state
const stateStr = `  const [editingTransactionForm, setEditingTransactionForm] = useState<Partial<CustomerTransaction>>({});`;
const newStateStr = `  const [editingTransactionForm, setEditingTransactionForm] = useState<Partial<CustomerTransaction>>({});
  
  const [historyDateStart, setHistoryDateStart] = useState<string>('');
  const [historyDateEnd, setHistoryDateEnd] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');`;
code = code.replace(stateStr, newStateStr);

// Add filter logic
const historyLogicStr = `  const customerHistoryTransactions = selectedCustomerForHistory 
    ? transactions.filter(t => t.customerId === selectedCustomerForHistory.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
    : [];`;

const newHistoryLogicStr = `  const customerHistoryTransactions = selectedCustomerForHistory 
    ? transactions.filter(t => {
        if (t.customerId !== selectedCustomerForHistory.id) return false;
        
        if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;

        if (historyDateStart && new Date(t.date) < new Date(historyDateStart)) return false;
        
        if (historyDateEnd) {
          const end = new Date(historyDateEnd);
          end.setHours(23, 59, 59, 999);
          if (new Date(t.date) > end) return false;
        }

        return true;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
    : [];`;
code = code.replace(historyLogicStr, newHistoryLogicStr);

// Add UI before transaction table
const uiStr = `              {/* Transactions List */}
              <div className="mb-4">
                <h3 className="font-bold print:text-black mb-4 border-b pb-2" style={{ borderBottomColor: store.settings?.invoiceTemplate_color || '#e5e7eb', color: store.settings?.invoiceTemplate_color || '#1f2937' }}>Hesap Hareketleri</h3>
                <table className="w-full text-sm text-left border-collapse">`;

const newUiStr = `              {/* Transactions List */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-2" style={{ borderBottomColor: store.settings?.invoiceTemplate_color || '#e5e7eb' }}>
                  <h3 className="font-bold print:text-black" style={{ color: store.settings?.invoiceTemplate_color || '#1f2937' }}>Hesap Hareketleri</h3>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 print:hidden">
                    <input 
                      type="date"
                      value={historyDateStart}
                      onChange={(e) => setHistoryDateStart(e.target.value)}
                      className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      title="Başlangıç Tarihi"
                    />
                    <input 
                      type="date"
                      value={historyDateEnd}
                      onChange={(e) => setHistoryDateEnd(e.target.value)}
                      className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      title="Bitiş Tarihi"
                    />
                    <select
                      value={historyTypeFilter}
                      onChange={(e) => setHistoryTypeFilter(e.target.value)}
                      className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="all">Tüm İşlemler</option>
                      <option value="Satış">Satış</option>
                      <option value="Tahsilat">Tahsilat</option>
                      <option value="Ödeme">Ödeme</option>
                      <option value="Alış">Alış</option>
                      <option value="Borçlandırma">Borçlandırma</option>
                      <option value="Devir">Devir</option>
                    </select>
                  </div>
                </div>
                <table className="w-full text-sm text-left border-collapse">`;
code = code.replace(uiStr, newUiStr);

fs.writeFileSync('pages/Cariler.tsx', code);
