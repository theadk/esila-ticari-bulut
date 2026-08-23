import React, { useState } from "react";
import { useAppStore } from "../lib/store";
import { Clock, DollarSign, Plus, Calendar, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, XCircle, Star } from "lucide-react";
import { AttendanceRecord, SalaryAdjustment, PerformanceScore } from "../types";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Check, Mail } from "lucide-react";
import toast from "react-hot-toast";

export const PuantajMaasView: React.FC = () => {
  const {
    personnel,
    setPersonnel,
    attendance,
    payrollApprovals,
    setPayrollApprovals,
    setAttendance,
    salaryAdjustments,
    setSalaryAdjustments,
    cashTransactions,
    setCashTransactions,
    performanceScores,
    setPerformanceScores,
  } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().substring(0, 7),
  );
  const [selectedPersonnel, setSelectedPersonnel] = useState<string>("");

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState<
    Partial<AttendanceRecord>
  >({
    date: new Date().toISOString().substring(0, 10),
    status: "Geldi",
    overtimeHours: 0,
  });

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<
    Partial<SalaryAdjustment>
  >({
    date: new Date().toISOString().substring(0, 10),
    type: "Avans",
    amount: 0,
  });

  const [expandedPersonnelId, setExpandedPersonnelId] = useState<string | null>(null);

  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceForm, setPerformanceForm] = useState<Partial<PerformanceScore>>({
    score: 80,
    notes: '',
  });

  const handleOpenPerformanceModal = (pId: string) => {
    const existing = performanceScores?.find((s) => s.personnelId === pId && s.month === selectedMonth);
    setPerformanceForm({
      score: existing ? existing.score : 80,
      notes: existing ? existing.notes : '',
    });
    setSelectedPersonnel(pId);
    setIsPerformanceModalOpen(true);
  };

  const handleSavePerformance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel || performanceForm.score === undefined) return;

    const existingIndex = (performanceScores || []).findIndex(
      (s) => s.personnelId === selectedPersonnel && s.month === selectedMonth
    );

    const newScore: PerformanceScore = {
      id: existingIndex >= 0 ? performanceScores[existingIndex].id : crypto.randomUUID(),
      personnelId: selectedPersonnel,
      month: selectedMonth,
      score: Number(performanceForm.score),
      notes: performanceForm.notes || '',
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      const updated = [...performanceScores];
      updated[existingIndex] = newScore;
      setPerformanceScores(updated);
    } else {
      setPerformanceScores([...(performanceScores || []), newScore]);
    }
    setIsPerformanceModalOpen(false);
  };


  const pendingRequests = (salaryAdjustments || []).filter(a => a.status === 'Bekliyor');

  const handleApproveRequest = (adj: SalaryAdjustment) => {
    if (window.confirm('Bu avans talebini onaylamak istediğinize emin misiniz? (Onaylandığında tutar otomatik olarak personelin hesabına avans olarak işlenecektir)')) {
      const updated = salaryAdjustments.map(a => a.id === adj.id ? { ...a, status: 'Onaylandı' } : a);
      setSalaryAdjustments(updated);
    }
  };

  const handleRejectRequest = (adj: SalaryAdjustment) => {
    if (window.confirm('Bu avans talebini reddetmek istediğinize emin misiniz?')) {
      const updated = salaryAdjustments.map(a => a.id === adj.id ? { ...a, status: 'Reddedildi' } : a);
      setSalaryAdjustments(updated);
    }
  };

  const personnelList = personnel.filter((p) => p.employmentStatus === "Aktif");

  
  const getPerformanceScore = (personnelId: string, month: string) => {
    const scoreRecord = performanceScores?.find(
      (s) => s.personnelId === personnelId && s.month === month
    );
    return scoreRecord ? scoreRecord.score : null;
  };

  const getPerformanceBonus = (personnelId: string, month: string) => {
    const score = getPerformanceScore(personnelId, month);
    if (score === null) return 0;
    const p = personnel.find((p) => p.id === personnelId);
    if (!p) return 0;
    // Maksimum prim = Maaşın %10'u
    // Performans notuna göre (0-100) bu maksimum primin yüzdesi alınır
    return (p.salary || 0) * 0.10 * (score / 100);
  };

  const getAttendanceStats = (personnelId: string, month: string) => {
    const records = attendance.filter(
      (a) => a.personnelId === personnelId && a.date.startsWith(month),
    );
    return {
      geldi: records.filter((a) => a.status === "Geldi").length,
      gelmedi: records.filter((a) => a.status === "Gelmedi").length,
      izinli: records.filter((a) => a.status === "İzinli").length,
      raporlu: records.filter((a) => a.status === "Raporlu").length,
      overtime: records.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    };
  };

  const getSalaryAdjustments = (personnelId: string, month: string) => {
    const adjs = salaryAdjustments.filter(
      (s) => s.personnelId === personnelId && s.date.startsWith(month) && (s.status === 'Onaylandı' || !s.status),
    );
    return {
      avans: adjs
        .filter((a) => a.type === "Avans")
        .reduce((sum, a) => sum + a.amount, 0),
      kesinti: adjs
        .filter((a) => a.type === "Kesinti")
        .reduce((sum, a) => sum + a.amount, 0),
      prim: adjs
        .filter((a) => a.type === "Prim")
        .reduce((sum, a) => sum + a.amount, 0),
    };
  };

  
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
    doc.text(`Personel: ${p.firstName} ${p.lastName}`, 14, 35);
    doc.text(`TC Kimlik: ${p.tcNo || '-'}`, 14, 42);
    doc.text(`Departman: ${p.department || '-'}`, 120, 35);
    doc.text(`Dönem: ${month}`, 120, 42);

    // Table Data
    const tableData = [
      ["Kök Maaş", `${(p.salary || 0).toLocaleString('tr-TR')} TL`],
      ["Çalışılan Gün", `${stats.geldi} Gün`],
      ["Devamsız/İzinli Kesintisi", `-${((stats.gelmedi * ((p.salary||0)/30))).toLocaleString('tr-TR')} TL`],
      ["Fazla Mesai", `+${(stats.overtime * ((p.salary||0)/30/8*1.5)).toLocaleString('tr-TR')} TL`],
      ["Performans Notu", performanceScore !== null ? `${performanceScore}/100` : "-"],
      ["Performans Primi", `+${performanceBonus.toLocaleString('tr-TR')} TL`],
      ["Diğer Primler", `+${adjs.prim.toLocaleString('tr-TR')} TL`],
      ["Avans Kesintisi", `-${adjs.avans.toLocaleString('tr-TR')} TL`],
      ["Diğer Kesintiler", `-${adjs.kesinti.toLocaleString('tr-TR')} TL`],
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
    doc.text(`${netSalary.toLocaleString('tr-TR')} TL`, 65, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Bu bordro sistem tarafından otomatik oluşturulmuştur.", 105, 280, { align: "center" });

    // Return as base64 string for email attachment
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    return pdfBase64;
  };

  const handleApprovePayroll = async () => {
    if (!window.confirm(`${selectedMonth} dönemi maaş bordrolarını onaylayıp personellere e-posta ile göndermek istediğinize emin misiniz?`)) return;
    
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
              subject: `${selectedMonth} Dönemi Maaş Bordrosu`,
              html: `<p>Sayın <b>${p.firstName} ${p.lastName}</b>,</p>
                     <p><b>${selectedMonth}</b> dönemine ait maaş bordronuz onaylanmıştır. Net hakedişiniz <b>${netSalary.toLocaleString('tr-TR')} TL</b> olarak hesaplanmıştır.</p>
                     <p>Bordro detaylarınızı ekteki PDF dosyasından inceleyebilirsiniz.</p>
                     <p>İyi çalışmalar dileriz.</p>`,
              attachments: [
                {
                  filename: `Bordro_${selectedMonth}_${p.firstName}_${p.lastName}.pdf`,
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

      toast.success(`${sentCount} adet bordro başarıyla gönderildi.${failCount > 0 ? ` (${failCount} gönderim başarısız)` : ''}`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Bordro onaylama sırasında hata oluştu.', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  const currentMonthApproval = payrollApprovals?.find(pa => pa.month === selectedMonth && pa.status === 'Onaylandı');

  const calculateNetSalary = (personnelId: string, month: string) => {
    const p = personnel.find((p) => p.id === personnelId);
    if (!p) return 0;

    const baseSalary = p.salary || 0;
    const stats = getAttendanceStats(personnelId, month);
    const adjs = getSalaryAdjustments(personnelId, month);
    const performanceBonus = getPerformanceBonus(personnelId, month);

    // Basit hesaplama: Kesintiler maaştan düşer, primler eklenir. (Avanslar da kesinti gibi hesaptan düşer)
    const dailyRate = baseSalary / 30;
    const deductionForAbsence = stats.gelmedi * dailyRate;

    // Mesai saat ücreti = Günlük / 8 * 1.5 gibi
    const hourlyRate = (dailyRate / 8) * 1.5;
    const overtimePay = stats.overtime * hourlyRate;

    return (
      baseSalary -
      deductionForAbsence +
      overtimePay +
      adjs.prim -
      adjs.avans -
      adjs.kesinti +
      performanceBonus
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-indigo-600" /> Puantaj ve Maaş Tahakkuku
          </h2>
          <p className="text-sm text-gray-500">
            Personel giriş-çıkışları, fazla mesai, avans ve hakediş
            hesaplamaları.
          </p>
        </div>
        <div className="flex gap-2">

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

          <input
            type="month"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3">Personel</th>
                <th className="px-4 py-3">Bölüm/Görev</th>
                <th className="px-4 py-3 text-center">Çalışılan Gün</th>
                <th className="px-4 py-3 text-center">Devamsız / İzinli</th>
                <th className="px-4 py-3 text-center">Fazla Mesai (Saat)</th>
                <th className="px-4 py-3 text-center">Performans</th>
                <th className="px-4 py-3 text-right">Kök Maaş</th>
                <th className="px-4 py-3 text-right">Avans/Kesinti</th>
                <th className="px-4 py-3 text-right">Prim</th>
                <th className="px-4 py-3 text-right text-indigo-700 font-bold">
                  Net Hakediş
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {personnelList.map((p) => {
                const stats = getAttendanceStats(p.id, selectedMonth);
                const adjs = getSalaryAdjustments(p.id, selectedMonth);
                const netSalary = calculateNetSalary(p.id, selectedMonth);

                const isExpanded = expandedPersonnelId === p.id;
                const monthAdjs = salaryAdjustments.filter(s => s.personnelId === p.id && s.date.startsWith(selectedMonth) && s.status !== "Reddedildi");
                
                return (
                  <React.Fragment key={p.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedPersonnelId(isExpanded ? null : p.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.department} / {p.position}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-600 font-medium">
                      {stats.geldi}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stats.gelmedi > 0 && (
                        <span className="text-red-500 mr-1">
                          {stats.gelmedi} D
                        </span>
                      )}
                      {(stats.izinli > 0 || stats.raporlu > 0) && (
                        <span className="text-amber-500">
                          {stats.izinli + stats.raporlu} İ/R
                        </span>
                      )}
                      {stats.gelmedi === 0 &&
                        stats.izinli === 0 &&
                        stats.raporlu === 0 &&
                        "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stats.overtime > 0 ? `${stats.overtime}s` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPerformanceModal(p.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-semibold transition-colors"
                      >
                        <Star size={14} className={getPerformanceScore(p.id, selectedMonth) !== null ? 'fill-purple-700' : ''} />
                        {getPerformanceScore(p.id, selectedMonth) ?? 'Not Gir'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.salary?.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {adjs.avans + adjs.kesinti > 0
                        ? `-${(adjs.avans + adjs.kesinti).toLocaleString("tr-TR")} ₺`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {adjs.prim > 0
                        ? `+${adjs.prim.toLocaleString("tr-TR")} ₺`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-700">
                      {netSalary.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={10} className="px-4 py-4 border-b border-gray-100">
                        <div className="text-sm">
                          <h4 className="font-semibold text-gray-700 mb-2">{p.firstName} {p.lastName} - {selectedMonth} Detayları</h4>
                          {monthAdjs.length > 0 ? (
                            <table className="w-full text-left text-sm bg-white border rounded-lg overflow-hidden">
                              <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                  <th className="px-3 py-2 border-b">Tarih</th>
                                  <th className="px-3 py-2 border-b">Tür</th>
                                  <th className="px-3 py-2 border-b">Açıklama</th>
                                  <th className="px-3 py-2 border-b text-right">Tutar</th>
<th className="px-3 py-2 border-b text-center">Durum</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthAdjs.map((adj) => (
                                  <tr key={adj.id} className="border-b last:border-0">
                                    <td className="px-3 py-2 text-gray-600">{new Date(adj.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        adj.type === 'Avans' || adj.type === 'Kesinti' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {adj.type}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{adj.description || '-'}</td>
                                    <td className={`px-3 py-2 text-right font-medium ${
                                      adj.type === 'Avans' || adj.type === 'Kesinti' ? 'text-red-600' : 'text-emerald-600'
                                    }`}>
                                      {adj.type === 'Avans' || adj.type === 'Kesinti' ? '-' : '+'}{adj.amount.toLocaleString("tr-TR")} ₺
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {adj.status === 'Bekliyor' && <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">Bekliyor</span>}
                                      {(!adj.status || adj.status === 'Onaylandı') && <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Onaylandı</span>}
                                      {adj.status === 'Reddedildi' && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Reddedildi</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-gray-500 italic">Bu aya ait avans, kesinti veya prim kaydı bulunmamaktadır.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      
      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-amber-200 bg-amber-100/50 flex items-center justify-between">
            <h3 className="font-bold text-amber-800 flex items-center gap-2">
              <Clock size={18} /> Onay Bekleyen Avans Talepleri
            </h3>
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {pendingRequests.length} Yeni Talep
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50/50 text-amber-800 font-medium border-b border-amber-100">
                <tr>
                  <th className="px-6 py-3">Personel</th>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Tutar</th>
                  <th className="px-6 py-3">Açıklama</th>
                  <th className="px-6 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pendingRequests.map(req => {
                  const p = personnel.find(x => x.id === req.personnelId);
                  const exceedWarning = p?.advanceLimit && req.amount > p.advanceLimit;
                  return (
                    <tr key={req.id} className="hover:bg-amber-100/50">
                      <td className="px-6 py-3 font-medium text-amber-900">{p ? `${p.firstName} ${p.lastName}` : 'Bilinmeyen'}</td>
                      <td className="px-6 py-3 text-amber-800">{new Date(req.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-6 py-3 font-bold text-amber-900">
                        {req.amount.toLocaleString('tr-TR')} ₺
                        {exceedWarning && (
                          <div className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                            <AlertTriangle size={12} /> Limit Aşıldı (L: {p.advanceLimit.toLocaleString('tr-TR')} ₺)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-amber-800">{req.description}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApproveRequest(req)} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors" title="Onayla">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleRejectRequest(req)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors" title="Reddet">
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
          <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
            <Plus size={18} /> Toplu Puantaj Girişi
          </h3>
          <p className="text-sm text-indigo-600 mb-4">
            Günün puantajını girmek için personel listesinden seçim
            yapabilirsiniz.
          </p>
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Günlük Puantaj Ekle
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
            <DollarSign size={18} /> Avans ve Prim Girişi
          </h3>
          <p className="text-sm text-amber-600 mb-4">
            Personel avans taleplerini ve performans primlerini buradan
            işleyebilirsiniz.
          </p>
          <button
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            + Ek Ödeme / Kesinti İşle
          </button>
        </div>
      </div>

      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                Günlük Puantaj Girişi
              </h3>
              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            <form
              className="p-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!attendanceForm.personnelId)
                  return alert("Personel seçiniz.");
                const newRecord: AttendanceRecord = {
                  id: "ATT-" + Math.floor(Math.random() * 10000),
                  personnelId: attendanceForm.personnelId!,
                  date: attendanceForm.date!,
                  status: attendanceForm.status as any,
                  overtimeHours: Number(attendanceForm.overtimeHours) || 0,
                };
                setAttendance([...attendance, newRecord]);
                setIsAttendanceModalOpen(false);
                setAttendanceForm({
                  date: new Date().toISOString().substring(0, 10),
                  status: "Geldi",
                  overtimeHours: 0,
                });
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personel
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={attendanceForm.personnelId || ""}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      personnelId: e.target.value,
                    })
                  }
                >
                  <option value="">Seçiniz...</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  required
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={attendanceForm.date}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={attendanceForm.status}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      status: e.target.value as any,
                    })
                  }
                >
                  <option value="Geldi">Geldi (Tam Gün)</option>
                  <option value="Gelmedi">Gelmedi</option>
                  <option value="İzinli">İzinli</option>
                  <option value="Raporlu">Raporlu</option>
                </select>
              </div>
              {attendanceForm.status === "Geldi" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fazla Mesai (Saat)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={attendanceForm.overtimeHours}
                    onChange={(e) =>
                      setAttendanceForm({
                        ...attendanceForm,
                        overtimeHours: Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                Ek Ödeme / Kesinti İşle
              </h3>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            <form
              className="p-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!adjustmentForm.personnelId)
                  return alert("Personel seçiniz.");
                const newAdj: SalaryAdjustment = {
                  id: "ADJ-" + Math.floor(Math.random() * 10000),
                  personnelId: adjustmentForm.personnelId!,
                  date: adjustmentForm.date!,
                  type: adjustmentForm.type as any,
                  amount: Number(adjustmentForm.amount) || 0,
                  description: "Puantaj Üzerinden Eklendi",
                };

                const selectedP = personnel.find(
                  (p) => p.id === adjustmentForm.personnelId,
                );
                if (selectedP) {
                  const newRecord = {
                    id: Math.random().toString(36).substr(2, 9),
                    targetId: selectedP.id,
                    type:
                      adjustmentForm.type === "Avans"
                        ? "Avans Ödemesi"
                        : ((adjustmentForm.type === "Prim"
                            ? "Ödül"
                            : "Belge") as any),
                    title: `Puantaj ${adjustmentForm.type}`,
                    description: `Puantaj Üzerinden Eklendi\nTutar: ${newAdj.amount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}`,
                    date: newAdj.date,
                  };
                  setPersonnel(
                    personnel.map((p) =>
                      p.id === selectedP.id
                        ? { ...p, records: [newRecord, ...(p.records || [])] }
                        : p,
                    ),
                  );

                  if (adjustmentForm.type === "Avans") {
                    const newCashTransaction = {
                      id: Math.random().toString(36).substr(2, 9),
                      date: newAdj.date,
                      type: "Gider" as const,
                      category: "Personel Avans" as const,
                      amount: newAdj.amount,
                      description: `${selectedP.firstName} ${selectedP.lastName} - Avans Ödemesi (Puantaj)`,
                      personnelId: selectedP.id,
                    };
                    setCashTransactions([
                      newCashTransaction,
                      ...(cashTransactions || []),
                    ]);
                  }
                }

                setSalaryAdjustments([...salaryAdjustments, newAdj]);
                setIsAdjustmentModalOpen(false);
                setAdjustmentForm({
                  date: new Date().toISOString().substring(0, 10),
                  type: "Avans",
                  amount: 0,
                });
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personel
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={adjustmentForm.personnelId || ""}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      personnelId: e.target.value,
                    })
                  }
                >
                  <option value="">Seçiniz...</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  required
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={adjustmentForm.date}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İşlem Türü
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={adjustmentForm.type}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      type: e.target.value as any,
                    })
                  }
                >
                  <option value="Avans">Avans</option>
                  <option value="Kesinti">Diğer Kesinti</option>
                  <option value="Prim">Performans Primi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (₺)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={adjustmentForm.amount || ""}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      amount: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {isPerformanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Star size={18} className="text-purple-600" /> Performans Notu ({selectedMonth})
              </h3>
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePerformance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performans Puanı (0-100)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="flex-1 accent-purple-600"
                    value={performanceForm.score}
                    onChange={(e) =>
                      setPerformanceForm({
                        ...performanceForm,
                        score: Number(e.target.value),
                      })
                    }
                  />
                  <span className="font-bold text-purple-700 w-12 text-center text-lg">{performanceForm.score}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Not: 100 üzerinden girilen puana göre, hakedişin %10'una kadar ek prim hesaplanıp maaşa yansıtılır.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama / Değerlendirme Notu
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={3}
                  value={performanceForm.notes}
                  onChange={(e) =>
                    setPerformanceForm({
                      ...performanceForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Başarı, hedeflere ulaşım durumu vb."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPerformanceModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
