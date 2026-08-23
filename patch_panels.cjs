const fs = require('fs');

// Patch Mutabakat.tsx
let mutabakatCode = fs.readFileSync('pages/Mutabakat.tsx', 'utf8');

const historyPanelMutabakat = `
        <div className="xl:col-span-1 space-y-6">
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
`;

if (!mutabakatCode.includes('İşlem Geçmişi')) {
  mutabakatCode = mutabakatCode.replace(
    '<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">',
    '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">\n          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">'
  );
  
  mutabakatCode = mutabakatCode.replace(
    /<\/div>\s*<Pagination\s+currentPage=\{currentPage\}/,
    '</div>\n      <Pagination currentPage={currentPage}'
  );
  
  mutabakatCode = mutabakatCode.replace(
    /<Pagination([\s\S]*?)\/>\s*<\/div>/,
    '<Pagination$1/>\n        </div>\n      </div>' + historyPanelMutabakat + '\n      </div>'
  );
  fs.writeFileSync('pages/Mutabakat.tsx', mutabakatCode);
}


// Patch Teklifler.tsx
let tekliflerCode = fs.readFileSync('pages/Teklifler.tsx', 'utf8');

const historyPanelTeklifler = `
        <div className="xl:col-span-1 space-y-6">
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
                      {p.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
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
`;

if (!tekliflerCode.includes('İşlem Geçmişi')) {
  tekliflerCode = tekliflerCode.replace(
    '<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">',
    '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">\n          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">'
  );
  
  tekliflerCode = tekliflerCode.replace(
    /<\/div>\s*<Pagination\s+currentPage=\{currentPage\}/,
    '</div>\n      <Pagination currentPage={currentPage}'
  );
  
  tekliflerCode = tekliflerCode.replace(
    /<Pagination([\s\S]*?)\/>\s*<\/div>/,
    '<Pagination$1/>\n        </div>\n      </div>' + historyPanelTeklifler + '\n      </div>'
  );

  // also we need to import Clock if not imported
  if (!tekliflerCode.includes('Clock,')) {
    tekliflerCode = tekliflerCode.replace(
      'import { Plus, Search, FileText',
      'import { Plus, Search, FileText, Clock'
    );
  }
  
  fs.writeFileSync('pages/Teklifler.tsx', tekliflerCode);
}
console.log('patched panels');
