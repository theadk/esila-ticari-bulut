const fs = require('fs');

let content = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// 1. Add imports if not present
if (!content.includes("import jsPDF")) {
  content = content.replace(
    "import { CariRaporModal } from '../components/CariRaporModal';",
    "import { CariRaporModal } from '../components/CariRaporModal';\nimport jsPDF from 'jspdf';\nimport html2canvas from 'html2canvas';"
  );
}

// 2. Add downloadEkstrePDF function
if (!content.includes('downloadEkstrePDF')) {
  const targetFn = 'const printCustomerHistory = (customer: Customer) => {\n    setPrintEkstreModalOpen(true);\n  };';
  const replacementFn = targetFn + `\n  const downloadEkstrePDF = async () => {\n    const printElement = document.getElementById('ekstre-print-content');\n    if (!printElement || !selectedCustomerForHistory) return;\n    const toastId = toast.loading("PDF hazırlanıyor...");\n    try {\n      const canvas = await html2canvas(printElement, { scale: 2, useCORS: true, logging: false });\n      const imgData = canvas.toDataURL('image/jpeg', 1.0);\n      const pdf = new jsPDF('p', 'mm', 'a4');\n      const pdfWidth = pdf.internal.pageSize.getWidth();\n      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;\n      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);\n      pdf.save(\`Cari_Ekstre_\${selectedCustomerForHistory.name.replace(/\\s+/g, '_')}.pdf\`);\n      toast.success("PDF başarıyla indirildi.", { id: toastId });\n    } catch (err) {\n      console.error(err);\n      toast.error("PDF oluşturulurken hata oluştu.", { id: toastId });\n    }\n  };`;
  content = content.replace(targetFn, replacementFn);
}

// 3. Update modal buttons and add id="ekstre-print-content"
const modalButtonsOld = `<button 
                   onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Printer size={18} />
                  Yazdır / PDF İndir
                </button>`;

const modalButtonsNew = `<button 
                  onClick={downloadEkstrePDF}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Download size={18} />
                  PDF İndir
                </button>
                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Printer size={18} />
                  Yazdır
                </button>`;

content = content.replace(modalButtonsOld, modalButtonsNew);

const printDivOld = `<div className="p-8 md:p-12 print:p-4 print:text-black font-sans bg-white">`;
const printDivNew = `<div id="ekstre-print-content" className="p-8 md:p-12 print:p-4 print:text-black font-sans bg-white">`;
content = content.replace(printDivOld, printDivNew);

fs.writeFileSync('pages/Cariler.tsx', content, 'utf8');
console.log('Successfully patched pages/Cariler.tsx');
