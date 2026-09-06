const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

if (!code.includes('import * as XLSX from "xlsx"')) {
    code = code.replace(
        'import {  hasPermission } from \'../lib/permissions\';',
        'import {  hasPermission } from \'../lib/permissions\';\nimport * as XLSX from "xlsx";'
    );
}

const handleExportExcel = `
  const handleExportExcel = () => {
    let invoicesToExport = invoices.filter(inv => inv.status === "Taslak" && inv.type !== "Gelen Fatura");
    if (selectedIds.length > 0) {
      invoicesToExport = invoicesToExport.filter(inv => selectedIds.includes(inv.id));
    }

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
  };
`;

if (!code.includes('handleExportExcel')) {
    code = code.replace(
        'const handleBulkPrint = () => {',
        handleExportExcel + '\n  const handleBulkPrint = () => {'
    );
}

const buttonHtml = `
                {activeTab === "Taslak" && (
                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Download size={14} /> Excel'e Aktar
                  </button>
                )}
`;

if (!code.includes("Excel'e Aktar")) {
    code = code.replace(
        '<Send size={14} /> Toplu GİB\'e Gönder\n                  </button>\n                )}',
        '<Send size={14} /> Toplu GİB\'e Gönder\n                  </button>\n                )}\n' + buttonHtml
    );
}

fs.writeFileSync('pages/EFatura.tsx', code);
console.log("Patched EFatura.tsx for Excel export");
