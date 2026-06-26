import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Target, TrendingUp, Trophy, AlertTriangle, DollarSign } from 'lucide-react';
import { PersonnelKPI } from '../types';

export const KPIView: React.FC = () => {
  const { personnel, personnelKPIs, setPersonnelKPIs } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));

  // Only show sales personnel or those who have KPIs
  const kpiPersonnel = personnel.filter(p => p.department === 'Satış' || p.department === 'Pazarlama' || p.department === 'Yönetim');

  // Helper to ensure a KPI record exists for rendering (mock behavior)
  const getKPI = (personnelId: string, month: string): PersonnelKPI => {
    let kpi = personnelKPIs.find(k => k.personnelId === personnelId && k.month === month);
    if (!kpi) {
      // Mock some goals if none exist for UI demonstration
      return {
        id: `mock-${personnelId}-${month}`,
        personnelId,
        month,
        targetSalesAmount: 500000,
        actualSalesAmount: Math.floor(Math.random() * 600000), // Random actual for demo
        targetNewLeads: 20,
        actualNewLeads: Math.floor(Math.random() * 25),
      };
    }
    return kpi;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" /> KPI ve Performans Metrikleri
          </h2>
          <p className="text-sm text-gray-500">Satış hedefleri, kotalar ve aylık başarı oranları.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {kpiPersonnel.map(p => {
          const kpi = getKPI(p.id, selectedMonth);
          const salesProgress = Math.min(100, Math.round((kpi.actualSalesAmount / kpi.targetSalesAmount) * 100)) || 0;
          const leadsProgress = Math.min(100, Math.round((kpi.actualNewLeads / kpi.targetNewLeads) * 100)) || 0;
          
          let statusColor = "bg-blue-500";
          if (salesProgress >= 100) statusColor = "bg-emerald-500";
          else if (salesProgress < 50) statusColor = "bg-red-500";
          else if (salesProgress < 80) statusColor = "bg-amber-500";

          return (
            <div key={p.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
               {salesProgress >= 100 && (
                 <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                   <Trophy size={12} /> Hedef Aşıldı
                 </div>
               )}
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                    {p.firstName?.[0] || ''}{p.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{p.firstName} {p.lastName}</h3>
                    <p className="text-sm text-gray-500">{p.position} / {p.department}</p>
                  </div>
               </div>

               <div className="space-y-5">
                  <div>
                     <div className="flex justify-between text-sm mb-1">
                       <span className="font-medium text-gray-700 flex items-center gap-1"><DollarSign size={14} className="text-gray-400"/> Satış Kotası</span>
                       <span className="font-bold text-gray-900">{kpi.actualSalesAmount.toLocaleString('tr-TR')} ₺ / <span className="text-gray-500 font-normal">{kpi.targetSalesAmount.toLocaleString('tr-TR')} ₺</span></span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5">
                       <div className={`h-2.5 rounded-full ${statusColor}`} style={{ width: `${salesProgress}%` }}></div>
                     </div>
                     <p className="text-xs text-right mt-1 font-medium text-gray-500">% {salesProgress} Tamamlanma</p>
                  </div>

                  <div>
                     <div className="flex justify-between text-sm mb-1">
                       <span className="font-medium text-gray-700 flex items-center gap-1"><Target size={14} className="text-gray-400"/> Yeni Potansiyel (Lead)</span>
                       <span className="font-bold text-gray-900">{kpi.actualNewLeads} / <span className="text-gray-500 font-normal">{kpi.targetNewLeads}</span></span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5">
                       <div className={`h-2.5 rounded-full bg-indigo-500`} style={{ width: `${leadsProgress}%` }}></div>
                     </div>
                  </div>
               </div>

               <div className="mt-6 pt-4 border-t flex justify-between items-center">
                 <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
                   Detaylı Rapor
                 </button>
                 <button className="text-sm border border-gray-300 rounded px-3 py-1 hover:bg-gray-50">
                   Hedefleri Düzenle
                 </button>
               </div>
            </div>
          );
        })}

        {kpiPersonnel.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
             <Target size={48} className="mx-auto mb-4 opacity-30" />
             <p>KPI takibi yapılacak Satış veya Pazarlama personeli bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// We will need to define DollarSign since it's used but not imported. Wait, I didn't import DollarSign in KPIView.tsx.
// Let's add it.
