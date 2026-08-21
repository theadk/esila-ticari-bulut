const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const search = '<h4 className="font-bold text-indigo-900">Bekleyen Taksitler</h4>';
const replace = `<div className="flex items-center gap-3">
                    <h4 className="font-bold text-indigo-900">Taksit Planı</h4>
                    <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      Kalan Taksit Borcu: {selectedCustomerForHistory.installments?.filter(i => !i.isPaid).reduce((sum, i) => sum + i.amount, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>`;
code = code.replace(search, replace);
fs.writeFileSync('pages/Cariler.tsx', code);
