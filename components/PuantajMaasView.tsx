import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Clock, DollarSign, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { AttendanceRecord, SalaryAdjustment } from '../types';

export const PuantajMaasView: React.FC = () => {
  const { personnel, attendance, setAttendance, salaryAdjustments, setSalaryAdjustments } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [selectedPersonnel, setSelectedPersonnel] = useState<string>('');

  const personnelList = personnel.filter(p => p.status === 'Aktif');

  const getAttendanceStats = (personnelId: string, month: string) => {
    const records = attendance.filter(a => a.personnelId === personnelId && a.date.startsWith(month));
    return {
      geldi: records.filter(a => a.status === 'Geldi').length,
      gelmedi: records.filter(a => a.status === 'Gelmedi').length,
      izinli: records.filter(a => a.status === 'İzinli').length,
      raporlu: records.filter(a => a.status === 'Raporlu').length,
      overtime: records.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
    };
  };

  const getSalaryAdjustments = (personnelId: string, month: string) => {
    const adjs = salaryAdjustments.filter(s => s.personnelId === personnelId && s.date.startsWith(month));
    return {
      avans: adjs.filter(a => a.type === 'Avans').reduce((sum, a) => sum + a.amount, 0),
      kesinti: adjs.filter(a => a.type === 'Kesinti').reduce((sum, a) => sum + a.amount, 0),
      prim: adjs.filter(a => a.type === 'Prim').reduce((sum, a) => sum + a.amount, 0)
    };
  };

  const calculateNetSalary = (personnelId: string, month: string) => {
    const p = personnel.find(p => p.id === personnelId);
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

    return baseSalary - deductionForAbsence + overtimePay + adjs.prim - adjs.avans - adjs.kesinti;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-indigo-600" /> Puantaj ve Maaş Tahakkuku
          </h2>
          <p className="text-sm text-gray-500">Personel giriş-çıkışları, fazla mesai, avans ve hakediş hesaplamaları.</p>
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
                <th className="px-4 py-3 text-right text-indigo-700 font-bold">Net Hakediş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {personnelList.map(p => {
                const stats = getAttendanceStats(p.id, selectedMonth);
                const adjs = getSalaryAdjustments(p.id, selectedMonth);
                const netSalary = calculateNetSalary(p.id, selectedMonth);
                
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-xs">{p.department} / {p.position}</td>
                    <td className="px-4 py-3 text-center text-emerald-600 font-medium">{stats.geldi}</td>
                    <td className="px-4 py-3 text-center">
                       {stats.gelmedi > 0 && <span className="text-red-500 mr-1">{stats.gelmedi} D</span>}
                       {(stats.izinli > 0 || stats.raporlu > 0) && <span className="text-amber-500">{stats.izinli + stats.raporlu} İ/R</span>}
                       {stats.gelmedi === 0 && stats.izinli === 0 && stats.raporlu === 0 && '-'}
                    </td>
                    <td className="px-4 py-3 text-center">{stats.overtime > 0 ? `${stats.overtime}s` : '-'}</td>
                    <td className="px-4 py-3 text-right">{p.salary?.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-4 py-3 text-right text-red-600">{(adjs.avans + adjs.kesinti) > 0 ? `-${(adjs.avans + adjs.kesinti).toLocaleString('tr-TR')} ₺` : '-'}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{adjs.prim > 0 ? `+${adjs.prim.toLocaleString('tr-TR')} ₺` : '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-700">{netSalary.toLocaleString('tr-TR')} ₺</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
            <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2"><Plus size={18}/> Toplu Puantaj Girişi</h3>
            <p className="text-sm text-indigo-600 mb-4">Günün puantajını girmek için personel listesinden seçim yapabilirsiniz.</p>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
               + Günlük Puantaj Ekle
            </button>
        </div>
        
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><DollarSign size={18}/> Avans ve Prim Girişi</h3>
            <p className="text-sm text-amber-600 mb-4">Personel avans taleplerini ve performans primlerini buradan işleyebilirsiniz.</p>
            <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
               + Ek Ödeme / Kesinti İşle
            </button>
        </div>
      </div>
    </div>
  );
};
