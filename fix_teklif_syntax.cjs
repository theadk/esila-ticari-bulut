const fs = require('fs');
let code = fs.readFileSync('pages/Teklifler.tsx', 'utf8');

// Undo the broken layout
code = code.replace(
  '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredProposals.length}\n        />\n        </div>\n      </div>',
  '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredProposals.length}\n        />\n'
);

const historyPanelCode = `        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-700">İşlem Geçmişi</h3>
            </div>
            <div className="p-0 max-h-[calc(100vh-200px)] overflow-y-auto">
              {proposals
                .filter(p => p.status === 'Onaylandı' || p.status === 'Reddedildi')
                .sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime())
                .slice(0, 15)
                .map((p, i) => (
                  <div key={p.id + i} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-800 line-clamp-1" title={p.customerName}>{p.customerName}</span>
                      {p.status === 'Onaylandı' ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-red-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center flex-wrap gap-x-1">
                      <span className="font-medium text-gray-600">#{p.id}</span>
                      <span>•</span>
                      <span className={p.status === 'Onaylandı' ? 'text-emerald-600' : 'text-red-600'}>
                        {p.status}
                      </span>
                      <span>•</span>
                      {new Date(p.updatedAt || p.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      {(p.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </p>
                  </div>
                ))}
              {proposals.filter(p => p.status === 'Onaylandı' || p.status === 'Reddedildi').length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  Henüz onay veya red işlemi bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
`;

code = code.replace(historyPanelCode, '');

// Now do it properly. Wrap the table + search in a grid? 
// No, Search is outside. Let's wrap just the table and pagination.
code = code.replace(
  '{/* Proposlas Table */}\n        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">',
  '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">\n          {/* Proposlas Table */}\n          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">'
);

code = code.replace(
  '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredProposals.length}\n        />',
  '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredProposals.length}\n        />\n        </div>\n' + historyPanelCode
);

fs.writeFileSync('pages/Teklifler.tsx', code);
console.log('fixed Teklifler.tsx syntax');
