import React, { useState } from "react";
import { useAppStore } from "../lib/store";
import { Clock, DollarSign, Plus, Calendar, AlertTriangle } from "lucide-react";
import { AttendanceRecord, SalaryAdjustment } from "../types";

export const PuantajMaasView: React.FC = () => {
  const {
    personnel,
    setPersonnel,
    attendance,
    setAttendance,
    salaryAdjustments,
    setSalaryAdjustments,
    cashTransactions,
    setCashTransactions,
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

  const personnelList = personnel.filter((p) => p.employmentStatus === "Aktif");

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
      (s) => s.personnelId === personnelId && s.date.startsWith(month),
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

  const calculateNetSalary = (personnelId: string, month: string) => {
    const p = personnel.find((p) => p.id === personnelId);
    if (!p) return 0;

    const baseSalary = p.salary || 0;
    const stats = getAttendanceStats(personnelId, month);
    const adjs = getSalaryAdjustments(personnelId, month);

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
      adjs.kesinti
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
                <th className="px-4 py-3 text-right">Kök Maaş</th>
                <th className="px-4 py-3 text-right">Avans/Kesinti</th>
                <th className="px-4 py-3 text-right">Prim</th>
                <th className="px-4 py-3 text-right text-indigo-700 font-bold">
                  Net Hakediş
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {personnelList.map((p) => {
                const stats = getAttendanceStats(p.id, selectedMonth);
                const adjs = getSalaryAdjustments(p.id, selectedMonth);
                const netSalary = calculateNetSalary(p.id, selectedMonth);

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};
