const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

if (!code.includes('jsPDF')) {
  code = code.replace(
    'import { AttendanceRecord, SalaryAdjustment, PerformanceScore } from "../types";',
    'import { AttendanceRecord, SalaryAdjustment, PerformanceScore } from "../types";\nimport jsPDF from "jspdf";\nimport "jspdf-autotable";\nimport { Check, Mail } from "lucide-react";\nimport toast from "react-hot-toast";'
  );
}

if (!code.includes('setPayrollApprovals,')) {
  code = code.replace(
    'payrollApprovals,',
    'payrollApprovals,\n    setPayrollApprovals,'
  );
}

const generatePdfLogic = `
  const [isApproving, setIsApproving] = useState(false);

  const generatePayslipPDF = async (p: any, month: string) => {
    const doc = new jsPDF();
    const stats = getAttendanceStats(p.id, month);
    const adjs = getSalaryAdjustments(p.id, month);
    const netSalary = calculateNetSalary(p.id, month);
    const performanceScore = getPerformanceScore(p.id, month);
    const performanceBonus = getPerformanceBonus(p.id, month);

    doc.addFont("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");
    
    // Header
    doc.setFontSize(20);
    doc.text("Esila Ticari - Maaş Bordrosu", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(\`Personel: \${p.firstName} \${p.lastName}\`, 14, 35);
    doc.text(\`TC Kimlik: \${p.tcNo || '-'}\`, 14, 42);
    doc.text(\`Departman: \${p.department || '-'}\`, 120, 35);
    doc.text(\`Dönem: \${month}\`, 120, 42);

    // Table Data
    const tableData = [
      ["Kök Maaş", \`\${(p.salary || 0).toLocaleString('tr-TR')} TL\`],
      ["Çalışılan Gün", \`\${stats.geldi} Gün\`],
      ["Devamsız/İzinli Kesintisi", \`-\${((stats.gelmedi * ((p.salary||0)/30))).toLocaleString('tr-TR')} TL\`],
      ["Fazla Mesai", \`+\${(stats.overtime * ((p.salary||0)/30/8*1.5)).toLocaleString('tr-TR')} TL\`],
      ["Performans Notu", performanceScore !== null ? \`\${performanceScore}/100\` : "-"],
      ["Performans Primi", \`+\${performanceBonus.toLocaleString('tr-TR')} TL\`],
      ["Diğer Primler", \`+\${adjs.prim.toLocaleString('tr-TR')} TL\`],
      ["Avans Kesintisi", \`-\${adjs.avans.toLocaleString('tr-TR')} TL\`],
      ["Diğer Kesintiler", \`-\${adjs.kesinti.toLocaleString('tr-TR')} TL\`],
    ];

    (doc as any).autoTable({
      startY: 55,
      head: [["Açıklama", "Tutar / Detay"]],
      body: tableData,
      theme: 'grid',
      styles: { font: "Roboto" },
      headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text("Net Ödenecek Tutar:", 14, finalY + 15);
    
    doc.setFontSize(16);
    doc.setTextColor(67, 56, 202);
    doc.text(\`\${netSalary.toLocaleString('tr-TR')} TL\`, 65, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Bu bordro sistem tarafından otomatik oluşturulmuştur.", 105, 280, { align: "center" });

    // Return as base64 string for email attachment
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    return pdfBase64;
  };

  const handleApprovePayroll = async () => {
    if (!window.confirm(\`\${selectedMonth} dönemi maaş bordrolarını onaylayıp personellere e-posta ile göndermek istediğinize emin misiniz?\`)) return;
    
    setIsApproving(true);
    const toastId = toast.loading('Bordrolar oluşturuluyor ve gönderiliyor...');
    
    try {
      let sentCount = 0;
      let failCount = 0;
      
      // Filter out only active personnel who have a salary defined and an email address
      const eligiblePersonnel = personnelList.filter(p => p.salary > 0 && p.email);

      for (const p of eligiblePersonnel) {
        try {
          const pdfBase64 = await generatePayslipPDF(p, selectedMonth);
          const netSalary = calculateNetSalary(p.id, selectedMonth);

          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: p.email,
              subject: \`\${selectedMonth} Dönemi Maaş Bordrosu\`,
              html: \`<p>Sayın <b>\${p.firstName} \${p.lastName}</b>,</p>
                     <p><b>\${selectedMonth}</b> dönemine ait maaş bordronuz onaylanmıştır. Net hakedişiniz <b>\${netSalary.toLocaleString('tr-TR')} TL</b> olarak hesaplanmıştır.</p>
                     <p>Bordro detaylarınızı ekteki PDF dosyasından inceleyebilirsiniz.</p>
                     <p>İyi çalışmalar dileriz.</p>\`,
              attachments: [
                {
                  filename: \`Bordro_\${selectedMonth}_\${p.firstName}_\${p.lastName}.pdf\`,
                  content: pdfBase64,
                  encoding: 'base64'
                }
              ]
            })
          });
          
          if (response.ok) {
            sentCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error('Failed to send payslip to', p.email, err);
          failCount++;
        }
      }

      // Record approval in store
      const approvalObj = {
        id: crypto.randomUUID(),
        month: selectedMonth,
        status: 'Onaylandı',
        approvedAt: new Date().toISOString(),
      };
      // Type is missing in standard array maybe, so let's push it safely
      setPayrollApprovals([...(payrollApprovals || []), approvalObj]);

      toast.success(\`\${sentCount} adet bordro başarıyla gönderildi.\${failCount > 0 ? \` (\${failCount} gönderim başarısız)\` : ''}\`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Bordro onaylama sırasında hata oluştu.', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  const currentMonthApproval = payrollApprovals?.find(pa => pa.month === selectedMonth && pa.status === 'Onaylandı');
`;

if (!code.includes('handleApprovePayroll')) {
  code = code.replace(
    'const calculateNetSalary = (personnelId: string, month: string) => {',
    generatePdfLogic + '\n  const calculateNetSalary = (personnelId: string, month: string) => {'
  );
}

const approveBtn = `
          {currentMonthApproval ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium">
              <CheckCircle size={16} />
              Onaylandı
            </div>
          ) : (
            <button
              onClick={handleApprovePayroll}
              disabled={isApproving || personnelList.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Mail size={16} />
              {isApproving ? 'Gönderiliyor...' : 'Bordroları Onayla ve Gönder'}
            </button>
          )}
`;

if (!code.includes('Bordroları Onayla ve Gönder')) {
  code = code.replace(
    '<div className="flex gap-2">\n          <input\n            type="month"',
    '<div className="flex gap-2">\n' + approveBtn + '\n          <input\n            type="month"'
  );
}

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched puantaj pdf send');
