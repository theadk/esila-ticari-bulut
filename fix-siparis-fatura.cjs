const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// 1. Add handleCreateInvoiceDraft
code = code.replace(
  "const filteredAndSortedOrders = useMemo(() => {",
  `const handleCreateInvoiceDraft = (order: Order) => {
    const existing = store.eInvoices?.find((inv: any) => inv.orderId === order.id);
    if (existing) {
       toast.error('Bu sipariş için zaten bir fatura oluşturulmuş.');
       return;
    }
    
    const customer = store.customers?.find((c: Customer) => c.id === order.customerId);
    const taxNumber = customer?.taxNumber || customer?.tcNumber || '';
    const invoiceType = taxNumber.length === 10 ? 'e-Fatura' : 'e-Arşiv';
    
    const newInvoice = {
      id: \`INV-\${Date.now()}\`,
      orderId: order.id,
      customerName: order.customerName,
      amount: order.total,
      type: invoiceType,
      invoiceType: 'SATIS',
      scenario: 'TEMELFATURA',
      date: new Date().toISOString().split('T')[0],
      status: 'Taslak',
      currency: 'TRY'
    };
    
    if (store.setEInvoices) {
      store.setEInvoices([...(store.eInvoices || []), newInvoice]);
      toast.success(invoiceType + ' taslağı başarıyla oluşturuldu.');
    }
  };

  const filteredAndSortedOrders = useMemo(() => {`
);

// 2. Add header
code = code.replace(
  `<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>\n                    </tr>`,
  `<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>\n                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>\n                    </tr>`
);

// 3. Add column
code = code.replace(
  `{order.status}\n                          </span>\n                        </td>\n                      </tr>`,
  `{order.status}\n                          </span>\n                        </td>\n                        <td className="px-6 py-4 whitespace-nowrap text-right">\n                          <button\n                            onClick={(e) => {\n                              e.stopPropagation();\n                              handleCreateInvoiceDraft(order);\n                            }}\n                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors border border-blue-100"\n                            title="E-Fatura Taslağı Oluştur"\n                          >\n                            <FileText className="w-3.5 h-3.5 mr-1.5" />\n                            Taslak Oluştur\n                          </button>\n                        </td>\n                      </tr>`
);

// 4. Update colSpan when empty
code = code.replace(
  `<td colSpan={4} className="px-6 py-12 text-center">`,
  `<td colSpan={5} className="px-6 py-12 text-center">`
);

fs.writeFileSync('pages/Siparisler.tsx', code);
