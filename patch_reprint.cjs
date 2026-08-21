const fs = require('fs');

let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const searchBtnCode = `<button onClick={() => handleDeleteTransaction(t)} className="text-red-600 hover:text-red-800 transition-colors" title="Sil">
                              <Trash2 size={16} />
                            </button>`;

const replaceBtnCode = `<button onClick={() => handleDeleteTransaction(t)} className="text-red-600 hover:text-red-800 transition-colors" title="Sil">
                              <Trash2 size={16} />
                            </button>
                            {(t.type === 'Tahsilat' || t.type === 'Ödeme') && (
                              <button onClick={() => printPaymentReceipt(t, selectedCustomerForHistory)} className="text-gray-600 hover:text-gray-800 transition-colors" title="Makbuz Yazdır">
                                <Printer size={16} />
                              </button>
                            )}`;

code = code.replace(searchBtnCode, replaceBtnCode);

const searchBtnCode2 = `<button onClick={() => handleDeleteTransaction(tx)} className="text-red-600 hover:text-red-800 transition-colors" title="Sil">
                               <Trash2 size={16} />
                             </button>`;

const replaceBtnCode2 = `<button onClick={() => handleDeleteTransaction(tx)} className="text-red-600 hover:text-red-800 transition-colors" title="Sil">
                               <Trash2 size={16} />
                             </button>
                             {(tx.type === 'Tahsilat' || tx.type === 'Ödeme') && (
                               <button onClick={() => printPaymentReceipt(tx, selectedCustomerForHistory)} className="text-gray-600 hover:text-gray-800 transition-colors print:hidden" title="Makbuz Yazdır">
                                 <Printer size={16} />
                               </button>
                             )}`;

code = code.replace(searchBtnCode2, replaceBtnCode2);

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched reprint buttons");
