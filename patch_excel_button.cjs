const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

const exportBtnHtml = `
        {activeTab === "Taslak" && (
            <div className="flex ml-4 mt-4 sm:mt-0 items-center justify-end">
              <button
                onClick={() => {
                  // If we are clicking this top button, maybe we clear selections or just export all
                  let invoicesToExport = invoices.filter(inv => inv.status === "Taslak" && inv.type !== "Gelen Fatura");
                  if (invoicesToExport.length === 0) {
                    alert("Dışa aktarılacak taslak fatura bulunamadı.");
                    return;
                  }
              
                  const data = invoicesToExport.map(inv => ({
                    "Fatura Numarası": inv.id,
                    "Fatura Tarihi": new Date(inv.date).toLocaleDateString("tr-TR"),
                    "Müşteri Adı": inv.customerName,
                    "Fatura Tipi": inv.type,
                    "Senaryo": inv.scenario,
                    "Fatura Türü": inv.invoiceType || 'SATIS',
                    "Durum": inv.status,
                    "Tutar": Number(inv.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
                    "Para Birimi": inv.currency || 'TRY',
                    "Döviz Kuru": inv.exchangeRate || 1
                  }));
              
                  const worksheet = XLSX.utils.json_to_sheet(data);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "Taslak Faturalar");
                  XLSX.writeFile(workbook, \`Taslak_Faturalar_\${new Date().getTime()}.xlsx\`);
                }}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download size={16} /> Tüm Taslakları Excel İndir
              </button>
            </div>
        )}
`;

code = code.replace(
  '{activeTab === "Giden" && (',
  exportBtnHtml + '\n        {activeTab === "Giden" && ('
);

fs.writeFileSync('pages/EFatura.tsx', code);
console.log("Patched EFatura.tsx for global excel button");
