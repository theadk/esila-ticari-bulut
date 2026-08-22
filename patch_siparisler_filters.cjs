const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// Add state
const stateStr = `  const [statusFilter, setStatusFilter] = useState<string>('all');`;
const newStateStr = `  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');`;
code = code.replace(stateStr, newStateStr);

// Add filter logic
const filterLogicStr = `    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }`;
const newFilterLogicStr = `    // Filter by date range
    if (dateStart) {
      result = result.filter(order => new Date(order.date) >= new Date(dateStart));
    }
    if (dateEnd) {
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      result = result.filter(order => new Date(order.date) <= end);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }`;
code = code.replace(filterLogicStr, newFilterLogicStr);

// Add dependencies
const depStr = `}, [store.orders, orderSearch, statusFilter, sortField, sortDirection]);`;
const newDepStr = `}, [store.orders, orderSearch, statusFilter, dateStart, dateEnd, sortField, sortDirection]);`;
code = code.replace(depStr, newDepStr);

// Add UI
const uiStr = `                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto print:hidden">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Sipariş no veya müşteri..." 
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 transition-colors outline-none"
                    />
                  </div>
                  
                  <div className="relative flex items-center">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none outline-none transition-colors"
                    >
                      <option value="all">Tüm Durumlar</option>
                      {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>`;
const newUiStr = `                <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto print:hidden">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex items-center">
                      <input 
                        type="date"
                        value={dateStart}
                        onChange={(e) => setDateStart(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none w-full sm:w-auto"
                        title="Başlangıç Tarihi"
                      />
                    </div>
                    <div className="relative flex items-center">
                      <input 
                        type="date"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none w-full sm:w-auto"
                        title="Bitiş Tarihi"
                      />
                    </div>
                    <div className="relative flex items-center">
                      <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none outline-none transition-colors w-full sm:w-auto"
                      >
                        <option value="all">Tüm Durumlar</option>
                        {Object.values(OrderStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Sipariş no veya müşteri..." 
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 transition-colors outline-none"
                    />
                  </div>
                </div>`;
code = code.replace(uiStr, newUiStr);

fs.writeFileSync('pages/Siparisler.tsx', code);
