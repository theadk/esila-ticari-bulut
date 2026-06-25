import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';
import { Users, Filter, Plus, FileText, Phone, Mail, Calendar, TrendingUp, Tag, Percent, X, Save, Edit2, Trash2 } from 'lucide-react';
import { Customer, MeetingNote, Campaign } from '../types';

export const CRM: React.FC = () => {
  const store = useAppStore();
  const { customers, meetingNotes, campaigns, setCampaigns } = store;
  
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'crm', 'view');

  const [activeTab, setActiveTab] = useState<'leads' | 'campaigns'>('leads');
  
  const leads = customers.filter(c => c.isLead);
  
  // Basic states for UI interaction
  const [showAddLead, setShowAddLead] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Campaign>({
    id: '',
    name: '',
    description: '',
    customerGroup: '',
    discountPercentage: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    isActive: true
  });

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const campaignToSave = {
      ...newCampaign,
      id: newCampaign.id || `CAMP-${Date.now()}`,
      discountPercentage: Number(newCampaign.discountPercentage)
    };
    
    if (newCampaign.id) {
       setCampaigns(campaigns.map(c => c.id === newCampaign.id ? campaignToSave : c));
    } else {
       setCampaigns([...campaigns, campaignToSave]);
    }
    setIsCampaignModalOpen(false);
  };

  const handleEditCampaign = (c: Campaign) => {
    setNewCampaign({
        ...c,
        startDate: new Date(c.startDate).toISOString().split('T')[0],
        endDate: new Date(c.endDate).toISOString().split('T')[0]
    });
    setIsCampaignModalOpen(true);
  };

  if (!canView) {
    return <div className="p-8 text-center text-red-600">Bu sayfayı görüntüleme yetkiniz yok.</div>;
  }

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
             <button 
               onClick={() => {
                 setNewCampaign({
                    id: '', name: '', description: '', customerGroup: '', discountPercentage: 0,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                    isActive: true
                 });
                 setIsCampaignModalOpen(true);
               }}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
               + Yeni Kampanya Tanımla
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {campaigns.map(c => (
               <div key={c.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative group">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditCampaign(c)} className="text-gray-400 hover:text-indigo-600 bg-white p-1 rounded-md shadow-sm border border-gray-100">
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) {
                          setCampaigns(campaigns.filter(cam => cam.id !== c.id));
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 bg-white p-1 rounded-md shadow-sm border border-gray-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-start mb-2 pr-16">
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

      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Tag className="text-indigo-600" />
                {newCampaign.id ? 'Kampanyayı Düzenle' : 'Yeni Kampanya Tanımla'}
              </h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCampaign} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Adı <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Örn: B2B Bahar İndirimi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    rows={2}
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Kampanya detayları ve şartları..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Grubu (Opsiyonel)</label>
                    <select
                      value={newCampaign.customerGroup || ''}
                      onChange={(e) => setNewCampaign({ ...newCampaign, customerGroup: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Tüm Müşteriler</option>
                      <option value="B2B Bayi">B2B Bayi</option>
                      <option value="Perakende">Perakende</option>
                      <option value="Toptancı">Toptancı</option>
                      <option value="VIP">VIP Müşteriler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İskonto Oranı (%) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={newCampaign.discountPercentage}
                      onChange={(e) => setNewCampaign({ ...newCampaign, discountPercentage: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={newCampaign.startDate}
                      onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={newCampaign.endDate}
                      onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newCampaign.isActive}
                    onChange={(e) => setNewCampaign({ ...newCampaign, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-800 cursor-pointer">
                    Kampanyayı Aktifleştir
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
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
