const fs = require('fs');
let code = fs.readFileSync('components/Taksitler.tsx', 'utf8');

if (!code.includes('import jsPDF')) {
    code = code.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\nimport jsPDF from 'jspdf';\nimport 'jspdf-autotable';");
}
if (!code.includes('Download,')) {
    code = code.replace("import { Calendar, Search, Filter, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react';", "import { Calendar, Search, Filter, CheckCircle2, Circle, AlertCircle, X, Download, FileText } from 'lucide-react';");
}

if (!code.includes('startDate')) {
    const stateRegex = /const \[statusFilter, setStatusFilter\] = useState[\s\S]*?\('all'\);/;
    code = code.replace(stateRegex, (match) => {
        return match + `\n  const [startDate, setStartDate] = useState('');\n  const [endDate, setEndDate] = useState('');`;
    });
}

// Replace filteredInstallments block
const startFiltered = code.indexOf('const filteredInstallments = useMemo(() => {');
const endFiltered = code.indexOf('}, [allInstallments, searchTerm, statusFilter');
if (startFiltered !== -1 && endFiltered !== -1) {
    const endFilteredFull = code.indexOf(']);', endFiltered) + 3;
    const blockToRemove = code.substring(startFiltered, endFilteredFull);
    
    const newBlock = `const filteredInstallments = useMemo(() => {
    return allInstallments.filter(inst => {
      // Search filter
      const matchesSearch = 
        inst.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Status filter
      if (statusFilter === 'paid' && !inst.isPaid) return false;
      if (statusFilter === 'unpaid' && inst.isPaid) return false;
      if (statusFilter === 'overdue') {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (inst.isPaid || new Date(inst.dueDate) >= today) return false;
      }
      
      // Date Range filter
      if (startDate) {
        if (new Date(inst.dueDate) < new Date(startDate)) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(inst.dueDate) > end) return false;
      }
      
      return true;
    });
  }, [allInstallments, searchTerm, statusFilter, startDate, endDate]);`;
    
    code = code.replace(blockToRemove, newBlock);
}

// Add PDF Export Function
const exportFunc = `
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add Turkish font support
    doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    
    doc.setFontSize(18);
    doc.text('Taksit Analiz Raporu', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(\`Tarih: \${new Date().toLocaleDateString('tr-TR')}\`, 14, 30);
    if (startDate || endDate) {
      doc.text(\`Filtre: \${startDate ? new Date(startDate).toLocaleDateString('tr-TR') : 'Baslangic'} - \${endDate ? new Date(endDate).toLocaleDateString('tr-TR') : 'Bitis'}\`, 14, 36);
    }
    
    // Calculate Totals for the current filter
    const totalCollected = filteredInstallments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
    const totalPending = filteredInstallments.filter(i => !i.isPaid).reduce((sum, i) => sum + i.amount, 0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const totalOverdue = filteredInstallments.filter(i => !i.isPaid && new Date(i.dueDate) < today).reduce((sum, i) => sum + i.amount, 0);
    
    doc.setTextColor(0);
    doc.text(\`Tahsil Edilen Tutar: \${totalCollected.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL\`, 14, 46);
    doc.text(\`Bekleyen Tutar: \${totalPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL\`, 14, 52);
    doc.setTextColor(255, 0, 0);
    doc.text(\`Vadesi Geciken Tutar: \${totalOverdue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL\`, 14, 58);
    doc.setTextColor(0);

    const tableColumn = ["Musteri", "Aciklama", "Vade Tarihi", "Tutar (TL)", "Durum"];
    const tableRows: any[] = [];
    
    filteredInstallments.forEach(inst => {
      const isOverdue = !inst.isPaid && new Date(inst.dueDate) < today;
      const statusStr = inst.isPaid ? 'Odendi' : (isOverdue ? 'Gecikti' : 'Bekliyor');
      const installmentData = [
        inst.customerName || '',
        inst.description || '',
        new Date(inst.dueDate).toLocaleDateString('tr-TR'),
        Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        statusStr
      ];
      tableRows.push(installmentData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      styles: { font: 'Roboto', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });
    
    doc.save('taksit-analiz-raporu.pdf');
  };
`;
if (!code.includes('const exportPDF')) {
    code = code.replace("const handlePostponeInstallment", exportFunc + "\n  const handlePostponeInstallment");
}

// UI changes
const dateFiltersHtml = `
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 whitespace-nowrap">Tarih:</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-auto"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-auto"
              />
            </div>
            
            <button 
              onClick={exportPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Download size={16} />
              <span>PDF Rapor Al</span>
            </button>
          </div>
`;

if (!code.includes('Tarih:</span>')) {
    code = code.replace('<div className="flex items-center gap-2 w-full sm:w-auto">', dateFiltersHtml + '\n          <div className="flex items-center gap-2 w-full sm:w-auto">');
}

fs.writeFileSync('components/Taksitler.tsx', code);
console.log("Patched Taksitler.tsx successfully");
