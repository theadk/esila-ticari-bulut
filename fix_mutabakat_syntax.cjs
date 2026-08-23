const fs = require('fs');
let code = fs.readFileSync('pages/Mutabakat.tsx', 'utf8');

// The incorrect insertion:
const historyPanelMutabakat = `        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-700">İşlem Geçmişi</h3>
            </div>
            <div className="p-0 max-h-[calc(100vh-200px)] overflow-y-auto">
              {reconciliations
                .filter(r => r.status === 'Onaylandı' || r.status === 'Reddedildi')
                .sort((a, b) => new Date(b.respondedAt || b.date).getTime() - new Date(a.respondedAt || a.date).getTime())
                .slice(0, 15)
                .map((r, i) => (
                  <div key={r.id + i} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-800 line-clamp-1" title={r.customerName}>{r.customerName}</span>
                      {r.status === 'Onaylandı' ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-red-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      <span className={r.status === 'Onaylandı' ? 'text-emerald-600' : 'text-red-600'}>
                        {r.status}
                      </span>
                      <span className="mx-1">•</span>
                      {new Date(r.respondedAt || r.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {r.responseNotes && (
                      <p className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-2 border border-gray-200 italic line-clamp-2" title={r.responseNotes}>
                        "{r.responseNotes}"
                      </p>
                    )}
                  </div>
                ))}
              {reconciliations.filter(r => r.status === 'Onaylandı' || r.status === 'Reddedildi').length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  Henüz onay veya red işlemi bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>`;

if (code.includes('        </div>\n      </div>\n' + historyPanelMutabakat)) {
  code = code.replace(
    '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredReconciliations.length}\n        />\n        </div>\n      </div>\n' + historyPanelMutabakat,
    '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredReconciliations.length}\n        />\n'
  );
  
  code = code.replace(
    '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">\n          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">',
    '<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">'
  );
}

// Re-apply properly
code = code.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">\n        <div className="border-b border-gray-100">\n          <nav className="flex space-x-4 px-4" aria-label="Tabs">',
  '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">\n          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">\n        <div className="border-b border-gray-100">\n          <nav className="flex space-x-4 px-4" aria-label="Tabs">'
);

code = code.replace(
  '<Pagination \n          currentPage={currentPage}',
  '<Pagination currentPage={currentPage}'
);

code = code.replace(
  '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredReconciliations.length}\n        />\n      </div>',
  '<Pagination currentPage={currentPage}\n          totalPages={totalPages}\n          onPageChange={setCurrentPage}\n          itemsPerPage={itemsPerPage}\n          onItemsPerPageChange={setItemsPerPage}\n          totalItems={filteredReconciliations.length}\n        />\n        </div>\n      </div>\n' + historyPanelMutabakat
);

fs.writeFileSync('pages/Mutabakat.tsx', code);
console.log('fixed Mutabakat.tsx syntax');
