const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

const updatedExportCode = `
                  let invoicesToExport = invoices.filter(inv => inv.status === "Taslak" && inv.type !== "Gelen Fatura");
                  if (invoicesToExport.length === 0) {
                    alert("Dışa aktarılacak taslak fatura bulunamadı.");
                    return;
                  }
              
                  const data = invoicesToExport.map(inv => {
                    const order = store.orders?.find((o) => o.id === inv.orderId);
                    const customer = store.customers?.find((c) => c.name === inv.customerName || c.id === order?.customerId);
                    
                    return {
                      "Belge Türü": inv.type || "e-Arşiv Fatura",
                      "Fatura Tipi": inv.invoiceType || "SATIS",
                      "Senaryo": inv.scenario || "TEMELFATURA",
                      "Fatura Numarası": inv.id,
                      "Tarih": new Date(inv.date).toLocaleDateString("tr-TR"),
                      "Cari Kodu": customer?.id || "",
                      "VKN/TCKN": customer?.taxNumber || "",
                      "Unvan": customer?.companyName || customer?.name || inv.customerName,
                      "Vergi Dairesi": customer?.taxOffice || "",
                      "İl": customer?.city || "",
                      "İlçe": customer?.district || "",
                      "Toplam Tutar": Number(inv.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
                      "Para Birimi": inv.currency || "TRY",
                      "Döviz Kuru": inv.exchangeRate || 1,
                      "Durum": inv.status
                    };
                  });
              
                  const worksheet = XLSX.utils.json_to_sheet(data);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "Taslak Faturalar");
                  XLSX.writeFile(workbook, \`Taslak_Faturalar_\${new Date().getTime()}.xlsx\`);
`;

code = code.replace(
  /let invoicesToExport = invoices\.filter\(inv => inv\.status === "Taslak" && inv\.type !== "Gelen Fatura"\);[\s\S]*?XLSX\.writeFile\(workbook, `Taslak_Faturalar_\$\{new Date\(\)\.getTime\(\)\}\.xlsx`\);/,
  updatedExportCode.trim()
);

// Also do it for the selected ones
const handleExportExcelRegex = /const handleExportExcel = \(\) => \{[\s\S]*?XLSX\.writeFile\(workbook, `Taslak_Faturalar_\$\{new Date\(\)\.getTime\(\)\}\.xlsx`\);\n  \};/;
const newHandleExportExcel = `const handleExportExcel = () => {
    let invoicesToExport = invoices.filter(inv => inv.status === "Taslak" && inv.type !== "Gelen Fatura");
    if (selectedIds.length > 0) {
      invoicesToExport = invoicesToExport.filter(inv => selectedIds.includes(inv.id));
    }

    if (invoicesToExport.length === 0) {
      alert("Dışa aktarılacak taslak fatura bulunamadı.");
      return;
    }

    const data = invoicesToExport.map(inv => {
      const order = store.orders?.find((o) => o.id === inv.orderId);
      const customer = store.customers?.find((c) => c.name === inv.customerName || c.id === order?.customerId);
      
      return {
        "Belge Türü": inv.type || "e-Arşiv Fatura",
        "Fatura Tipi": inv.invoiceType || "SATIS",
        "Senaryo": inv.scenario || "TEMELFATURA",
        "Fatura Numarası": inv.id,
        "Tarih": new Date(inv.date).toLocaleDateString("tr-TR"),
        "Cari Kodu": customer?.id || "",
        "VKN/TCKN": customer?.taxNumber || "",
        "Unvan": customer?.companyName || customer?.name || inv.customerName,
        "Vergi Dairesi": customer?.taxOffice || "",
        "İl": customer?.city || "",
        "İlçe": customer?.district || "",
        "Toplam Tutar": Number(inv.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
        "Para Birimi": inv.currency || "TRY",
        "Döviz Kuru": inv.exchangeRate || 1,
        "Durum": inv.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Taslak Faturalar");
    XLSX.writeFile(workbook, \`Taslak_Faturalar_\${new Date().getTime()}.xlsx\`);
  };`;

code = code.replace(handleExportExcelRegex, newHandleExportExcel);

fs.writeFileSync('pages/EFatura.tsx', code);
console.log("Enhanced excel export");
