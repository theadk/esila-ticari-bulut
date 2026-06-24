import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Users, Filter, Plus, FileText, Phone, Mail, Calendar, TrendingUp, Tag, Percent } from 'lucide-react';
import { Customer, MeetingNote, Campaign } from '../types';

export const CRM: React.FC = () => {
  const { customers, meetingNotes, campaigns, setCampaigns } = useAppStore();
  const [activeTab, setActiveTab] = useState<'leads' | 'campaigns'>('leads');
  
  const leads = customers.filter(c => c.isLead);
  
  // Basic states for UI interaction
  const [showAddLead, setShowAddLead] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">CRM ve Kampanya Yönetimi</h2>
          <p className="text-gray-500 text-sm mt-1">Potansiyel müşteriler, görüşme notları ve kampanyalar.</p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'leads' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><Users size={18}/> Potansiyel Müşteriler (Leads)</div>
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'campaigns' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><Tag size={18}/> Kampanya ve İskonto</div>
        </button>
      </div>

      {activeTab === 'leads' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Filter className="text-indigo-600" /> Lead Havuzu ve Görüşmeler
             </h3>
             <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
               + Yeni Lead Ekle
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
             {/* Lead Kanban Board Demo */}
             {['Yeni', 'Görüşülüyor', 'Teklif Verildi', 'Kazanıldı'].map(status => (
                <div key={status} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <h4 className="font-bold text-gray-700 mb-4">{status}</h4>
                   <div className="space-y-3">
                     {leads.filter(l => l.leadStatus === status).map(lead => (
                        <div key={lead.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-300 cursor-pointer">
                           <p className="font-medium text-sm text-gray-800">{lead.companyName || lead.name}</p>
                           <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone size={12}/> {lead.phone}</p>
                           <div className="mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                              Son Görüşme: Dün
                           </div>
                        </div>
                     ))}
                     {leads.filter(l => l.leadStatus === status).length === 0 && (
                       <p className="text-xs text-gray-400 italic">Bu aşamada kayıt yok.</p>
                     )}
                   </div>
                </div>
             ))}
           </div>
           
           {leads.length === 0 && (
             <div className="text-center py-12 text-gray-500">
               <p>Örnek data bulunamadı. Potansiyel müşteri eklendiğinde burada görünecektir.</p>
             </div>
           )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Percent className="text-indigo-600" /> Aktif Kampanyalar ve İskontolar
             </h3>
             <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
               + Yeni Kampanya Tanımla
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {campaigns.map(c => (
               <div key={c.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-gray-800 text-lg">{c.name}</h4>
                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Aktif' : 'Pasif'}
                     </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 h-10">{c.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm mb-4">
                     <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold">
                       % {c.discountPercentage} İskonto
                     </div>
                     <div className="text-gray-500 flex items-center gap-1">
                       <Users size={14}/> {c.customerGroup || 'Tüm Müşteriler'}
                     </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-center justify-between border-t pt-3">
                     <span className="flex items-center gap-1"><Calendar size={12}/> Başlangıç: {new Date(c.startDate).toLocaleDateString('tr-TR')}</span>
                     <span className="flex items-center gap-1">Bitiş: {new Date(c.endDate).toLocaleDateString('tr-TR')}</span>
                  </div>
               </div>
             ))}

             {campaigns.length === 0 && (
               <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                 <Tag size={32} className="mx-auto mb-2 opacity-50" />
                 <p>Tanımlanmış bir kampanya bulunmuyor.</p>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};
