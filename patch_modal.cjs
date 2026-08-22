const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// add state
code = code.replace(
  "const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');",
  "const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');\n  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);"
);

// add onClick to tr
code = code.replace(
  /<tr key=\{order\.id\} className="hover:bg-gray-50\/50 transition-colors group cursor-pointer">/g,
  '<tr key={order.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>'
);

// add Modal HTML before last closing div
const modalCode = `
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in print:bg-white print:relative print:inset-auto print:block" style={{ zIndex: 60 }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col print:shadow-none print:max-w-full print:m-0 print:border-none print:rounded-none">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0 print:hidden">
              <div>
                <h3 className="font-bold text-xl text-gray-800">Sipariş Detayı</h3>
                <p className="text-sm text-gray-500 mt-1">#{selectedOrder.id.substring(0, 8).toUpperCase()} - {new Date(selectedOrder.date).toLocaleString('tr-TR')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Printer size={16} />
                  Yazdır
                </button>
                <button type="button" onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-red-500 transition-colors p-2">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto print:p-0 flex-1 print:overflow-visible">
              <div className="print-target bg-white">
                <div className="hidden print:block mb-8 border-b pb-4">
                  <h1 className="text-2xl font-bold mb-2">SİPARİŞ FİŞİ</h1>
                  <p><strong>Sipariş No:</strong> #{selectedOrder.id.substring(0, 8).toUpperCase()}</p>
                  <p><strong>Tarih:</strong> {new Date(selectedOrder.date).toLocaleString('tr-TR')}</p>
                  <p><strong>Müşteri:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Durum:</strong> {selectedOrder.status}</p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 print:hidden">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Müşteri</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Durum</p>
                    <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border \${getStatusColor(selectedOrder.status)}\`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Ürünler</h4>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-sm print:text-xs">
                      <thead className="bg-gray-50 text-gray-600 print:bg-transparent border-b">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Ürün</th>
                          <th className="px-4 py-2 text-center font-semibold">Miktar</th>
                          <th className="px-4 py-2 text-right font-semibold">Birim Fiyat</th>
                          <th className="px-4 py-2 text-right font-semibold">Toplam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                            <td className="px-4 py-3 text-center">{item.quantity} {item.unit || 'Adet'}</td>
                            <td className="px-4 py-3 text-right">{(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{((item.price || 0) * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <div className="w-full sm:w-1/2 md:w-1/3">
                    <div className="flex justify-between items-center py-2 text-lg font-bold">
                      <span>Genel Toplam:</span>
                      <span className="text-blue-600">{(selectedOrder.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                  </div>
                </div>
                
                {selectedOrder.notes && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Sipariş Notu:</p>
                    <p className="text-sm text-amber-900">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\n  \);\n};\n?$/, modalCode + '    </div>\n  );\n};\n');
fs.writeFileSync('pages/Siparisler.tsx', code);
