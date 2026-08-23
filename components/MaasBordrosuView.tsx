import React, { useState, useMemo } from "react";
import { useAppStore } from "../lib/store";
import { Calculator, Download, CheckCircle, Clock, AlertTriangle , ShieldCheck } from "lucide-react";
import { Personnel } from "../types";

export const MaasBordrosuView: React.FC = () => {
  const {
    personnel,
    attendance,
    salaryAdjustments,
    payrollApprovals,
    setPayrollApprovals,
  } = useAppStore();

  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().substring(0, 7)
  );

  const isMonthApproved = payrollApprovals?.some((a) => a.month === selectedMonth && a.status === 'Onaylandı');
  
  const handleApprove = () => {
    if (window.confirm('Bu döneme ait maaş bordrosunu onaylamak istediğinize emin misiniz?\n\nBordro onaylandıktan sonra bu aya ait yeni puantaj veya ek kesinti/prim girişi yapılamayacaktır.')) {
      const newApproval = {
        id: String(Date.now()),
        month: selectedMonth,
        status: 'Onaylandı',
        approvedAt: new Date().toISOString()
      };
      setPayrollApprovals([...(payrollApprovals || []), newApproval]);
    }
  };

  const activePersonnel = personnel.filter((p) => p.employmentStatus === "Aktif");

  const payrollData = useMemo(() => {
    return activePersonnel.map((p) => {
      const baseSalary = p.salary || 0;
      const dailyRate = baseSalary / 30;
      const hourlyRate = (dailyRate / 8) * 1.5;

      const records = attendance.filter(
        (a) => a.personnelId === p.id && a.date.startsWith(selectedMonth)
      );

      const geldi = records.filter((a) => a.status === "Geldi").length;
      const gelmedi = records.filter((a) => a.status === "Gelmedi").length;
      const izinli = records.filter((a) => a.status === "İzinli").length;
      const raporlu = records.filter((a) => a.status === "Raporlu").length;
      const overtime = records.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

      const adjs = salaryAdjustments.filter(
        (s) => s.personnelId === p.id && s.date.startsWith(selectedMonth)
      );

      const avans = adjs
        .filter((a) => a.type === "Avans")
        .reduce((sum, a) => sum + a.amount, 0);
      const kesinti = adjs
        .filter((a) => a.type === "Kesinti")
        .reduce((sum, a) => sum + a.amount, 0);
      const prim = adjs
        .filter((a) => a.type === "Prim")
        .reduce((sum, a) => sum + a.amount, 0);

      const deductionForAbsence = gelmedi * dailyRate;
      const overtimePay = overtime * hourlyRate;

      const netSalary =
        baseSalary - deductionForAbsence + overtimePay + prim - avans - kesinti;

      return {
        personnel: p,
        stats: { geldi, gelmedi, izinli, raporlu, overtime },
        adjs: { avans, kesinti, prim },
        financials: {
          baseSalary,
          deductionForAbsence,
          overtimePay,
          netSalary,
        },
      };
    });
  }, [activePersonnel, attendance, salaryAdjustments, selectedMonth]);

  const totalNet = payrollData.reduce((sum, d) => sum + d.financials.netSalary, 0);
  const totalAdvances = payrollData.reduce((sum, d) => sum + d.adjs.avans, 0);
  const totalPremiums = payrollData.reduce((sum, d) => sum + d.adjs.prim, 0);


  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${selectedMonth} - Genel Maaş Bordrosu</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 20px; }
            h1 { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            table { border-collapse: collapse; margin-top: 20px; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .net-salary { font-weight: bold; color: #4f46e5; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 30%; text-align: center; }
            .summary-card h4 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
            .summary-card p { margin: 0; font-size: 20px; font-weight: bold; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${selectedMonth} - Genel Maaş Bordrosu</h1>
          
          <div class="summary">
            <div class="summary-card">
              <h4>Toplam Net Ödenecek</h4>
              <p>${totalNet.toLocaleString("tr-TR")} ₺</p>
            </div>
            <div class="summary-card">
              <h4>Toplam Avans & Kesinti</h4>
              <p>${(totalAdvances + payrollData.reduce((s, d) => s + d.adjs.kesinti, 0)).toLocaleString("tr-TR")} ₺</p>
            </div>
            <div class="summary-card">
              <h4>Toplam Prim & Mesai</h4>
              <p>${(totalPremiums + payrollData.reduce((s, d) => s + d.financials.overtimePay, 0)).toLocaleString("tr-TR")} ₺</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Personel</th>
                <th class="text-right">Kök Maaş</th>
                <th class="text-center">Devamsız/Kesinti</th>
                <th class="text-center">Mesai/Prim</th>
                <th class="text-right">Avanslar</th>
                <th class="text-right">Net Ödenecek</th>
              </tr>
            </thead>
            <tbody>
              ${payrollData.map(row => `
                <tr>
                  <td>
                    <strong>${row.personnel.firstName} ${row.personnel.lastName}</strong><br/>
                    <small>${row.personnel.department} / ${row.personnel.position}</small>
                  </td>
                  <td class="text-right">${row.financials.baseSalary.toLocaleString("tr-TR")} ₺</td>
                  <td class="text-center">
                    ${row.stats.gelmedi > 0 ? `<div>Devamsız: ${row.stats.gelmedi} Gün (-${row.financials.deductionForAbsence.toLocaleString("tr-TR")} ₺)</div>` : ''}
                    ${row.adjs.kesinti > 0 ? `<div>Kesinti: -${row.adjs.kesinti.toLocaleString("tr-TR")} ₺</div>` : ''}
                    ${row.stats.gelmedi === 0 && row.adjs.kesinti === 0 ? '-' : ''}
                  </td>
                  <td class="text-center">
                    ${row.stats.overtime > 0 ? `<div>Mesai: ${row.stats.overtime} Saat (+${row.financials.overtimePay.toLocaleString("tr-TR")} ₺)</div>` : ''}
                    ${row.adjs.prim > 0 ? `<div>Prim: +${row.adjs.prim.toLocaleString("tr-TR")} ₺</div>` : ''}
                    ${row.stats.overtime === 0 && row.adjs.prim === 0 ? '-' : ''}
                  </td>
                  <td class="text-right">${row.adjs.avans > 0 ? `-${row.adjs.avans.toLocaleString("tr-TR")} ₺` : '-'}</td>
                  <td class="text-right net-salary">${row.financials.netSalary.toLocaleString("tr-TR")} ₺</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintSingle = (row: typeof payrollData[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${row.personnel.firstName} ${row.personnel.lastName} - Maaş Bordrosu</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 30px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #fafafa; }
            .header-info div { line-height: 1.6; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f9fafb; width: 50%; }
            .text-right { text-align: right; }
            .amount { font-family: monospace; font-size: 1.1em; }
            .total-row th, .total-row td { background-color: #f0fdf4; font-size: 1.2em; border-top: 2px solid #22c55e; }
            .signature-area { display: flex; justify-content: space-between; margin-top: 60px; }
            .signature-box { width: 40%; border-top: 1px solid #333; text-align: center; padding-top: 10px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Personel Maaş Bordrosu</h1>
          
          <div class="header-info">
            <div>
              <strong>Personel Adı:</strong> ${row.personnel.firstName} ${row.personnel.lastName}<br/>
              <strong>Departman:</strong> ${row.personnel.department}<br/>
              <strong>Görev:</strong> ${row.personnel.position}
            </div>
            <div class="text-right">
              <strong>Bordro Dönemi:</strong> ${selectedMonth}<br/>
              <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Kök Maaş</th>
                <td class="text-right amount">${row.financials.baseSalary.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Mesai Ücreti ${row.stats.overtime > 0 ? `(${row.stats.overtime} Saat)` : ''}</th>
                <td class="text-right amount">${row.financials.overtimePay > 0 ? '+' : ''}${row.financials.overtimePay.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Primler</th>
                <td class="text-right amount">${row.adjs.prim > 0 ? '+' : ''}${row.adjs.prim.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Devamsızlık Kesintisi ${row.stats.gelmedi > 0 ? `(${row.stats.gelmedi} Gün)` : ''}</th>
                <td class="text-right amount">${row.financials.deductionForAbsence > 0 ? '-' : ''}${row.financials.deductionForAbsence.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Diğer Kesintiler</th>
                <td class="text-right amount">${row.adjs.kesinti > 0 ? '-' : ''}${row.adjs.kesinti.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Kullanılan Avanslar</th>
                <td class="text-right amount">${row.adjs.avans > 0 ? '-' : ''}${row.adjs.avans.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr class="total-row">
                <th>NET ÖDENECEK TUTAR</th>
                <td class="text-right amount"><strong>${row.financials.netSalary.toLocaleString("tr-TR")} ₺</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="signature-area">
            <div class="signature-box">
              İşveren / Yetkili İmza
            </div>
            <div class="signature-box">
              Personel İmza<br/>
              <small>(Bordroyu aldım, mutabıkım)</small>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (

    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <Calculator size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Maaş Bordrosu</h3>
            <p className="text-sm text-gray-500">Ay bazlı maaş hak edişleri, avans, kesinti ve net ödemeler</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMonthApproved ? (
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-medium border border-indigo-100">
              <ShieldCheck size={18} />
              Onaylandı
            </div>
          ) : (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap font-medium"
            >
              <CheckCircle size={18} />
              Bordroyu Onayla
            </button>
          )}
          
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            <Download size={18} />
            Yazdır
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-gray-500 text-sm font-medium mb-1">Toplam Net Ödenecek</h4>
          <p className="text-3xl font-bold text-indigo-700">{totalNet.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-gray-500 text-sm font-medium mb-1">Toplam Avans & Kesinti</h4>
          <p className="text-3xl font-bold text-red-600">{(totalAdvances + payrollData.reduce((s, d) => s + d.adjs.kesinti, 0)).toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-gray-500 text-sm font-medium mb-1">Toplam Prim & Mesai</h4>
          <p className="text-3xl font-bold text-emerald-600">{(totalPremiums + payrollData.reduce((s, d) => s + d.financials.overtimePay, 0)).toLocaleString("tr-TR")} ₺</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 py-4">Personel</th>
                <th className="px-4 py-4 text-right">Kök Maaş</th>
                <th className="px-4 py-4 text-center">Devamsız / Kesinti</th>
                <th className="px-4 py-4 text-center">Mesai / Prim</th>
                <th className="px-4 py-4 text-right">Avanslar</th>
                <th className="px-4 py-4 text-right text-indigo-700 font-bold">Net Ödenecek</th>
                <th className="px-4 py-4 text-center">Durum</th>
                <th className="px-4 py-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrollData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {payrollData.map((row) => (
                <tr key={row.personnel.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{row.personnel.firstName} {row.personnel.lastName}</div>
                    <div className="text-xs text-gray-500">{row.personnel.department} / {row.personnel.position}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {row.financials.baseSalary.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.stats.gelmedi > 0 && (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs">
                          {row.stats.gelmedi} Gün ({row.financials.deductionForAbsence.toLocaleString("tr-TR")} ₺)
                        </span>
                      )}
                      {row.adjs.kesinti > 0 && (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs">
                          Ek Kesinti: {row.adjs.kesinti.toLocaleString("tr-TR")} ₺
                        </span>
                      )}
                      {row.stats.gelmedi === 0 && row.adjs.kesinti === 0 && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.stats.overtime > 0 && (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-xs">
                          {row.stats.overtime} Saat ({row.financials.overtimePay.toLocaleString("tr-TR")} ₺)
                        </span>
                      )}
                      {row.adjs.prim > 0 && (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-xs">
                          Prim: {row.adjs.prim.toLocaleString("tr-TR")} ₺
                        </span>
                      )}
                      {row.stats.overtime === 0 && row.adjs.prim === 0 && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.adjs.avans > 0 ? (
                      <span className="text-red-600 font-medium">
                        -{row.adjs.avans.toLocaleString("tr-TR")} ₺
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-700 text-base bg-indigo-50/30">
                    {row.financials.netSalary.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isMonthApproved ? (
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100">
                        <ShieldCheck size={12} />
                        Onaylandı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        Taslak
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handlePrintSingle(row)}
                      className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Kişisel Bordroyu Yazdır"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
