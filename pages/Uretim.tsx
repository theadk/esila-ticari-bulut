import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';
import { Factory, Component, Wrench, Settings, Play, CheckCircle, ClipboardList, AlertTriangle, ShieldCheck, Hammer } from 'lucide-react';
import { BOM, WorkOrder, Product } from '../types';

export const Uretim: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'uretim', 'view');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'receteler' | 'isemirleri' | 'kalite' | 'istasyon'>('dashboard');

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Factory size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Üretim (Ar-Ge & İmalat) modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  const { boms, setBoms, workOrders, setWorkOrders, products, notifications, setNotifications, users } = store;

  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [isWoModalOpen, setIsWoModalOpen] = useState(false);

  // BOM Form
  const [bomForm, setBomForm] = useState<Partial<BOM>>({ name: '', targetProductId: '', items: [], estimatedTimeMinutes: 60, isActive: true });
  // WO Form
  const [woForm, setWoForm] = useState<Partial<WorkOrder>>({ bomId: '', plannedQuantity: 1, priority: 'Normal' });

  const activeWorkOrders = workOrders.filter(w => w.status === 'Üretimde' || w.status === 'Planlandı');
  const qaPending = workOrders.filter(w => w.status === 'Kalite Kontrol');

  const handleCompleteWorkOrder = (wo: WorkOrder) => {
    const targetProd = products.find(p => p.id === wo.targetProductId);
    const prodName = targetProd?.name || 'Bilinmeyen Ürün';

    const newWos = workOrders.map(w => w.id === wo.id ? { ...w, status: 'Tamamlandı' as const, producedQuantity: w.plannedQuantity } : w);
    setWorkOrders(newWos);
    
    // Create notifications for managers and relevant personnel
    const managers = users.filter(u => u.permissions.uretim?.edit || u.role === 'admin' || u.role === 'manager' || u.id === currentUser.id);
    const newNotifications = managers.map(mgr => ({
      id: 'NOTIF-' + Math.random().toString(36).substr(2, 9),
      userId: mgr.id,
      title: 'İş Emri Tamamlandı',
      message: `${wo.id} numaralı iş emri başarıyla tamamlandı. Ürün: ${prodName}, Miktar: ${wo.plannedQuantity}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'success' as const,
      link: 'uretim',
    }));
    
    setNotifications([...notifications, ...newNotifications]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Üretim & İmalat Yönetimi</h2>
          <p className="text-gray-500 text-sm mt-1">Gelişmiş Ar-Ge, Ürün Reçeteleri, İş Emirleri ve Kalite Kontrol süreçleri.</p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><Factory size={18}/> Üretim Panosu</div>
        </button>
        <button
          onClick={() => setActiveTab('receteler')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'receteler' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><Component size={18}/> Ürün Reçeteleri (BOM)</div>
        </button>
        <button
          onClick={() => setActiveTab('isemirleri')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'isemirleri' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><ClipboardList size={18}/> İş Emirleri</div>
        </button>
        <button
          onClick={() => setActiveTab('kalite')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'kalite' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><ShieldCheck size={18}/> Kalite Kontrol (QA) <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs ml-1">{qaPending.length}</span></div>
        </button>
        <button
          onClick={() => setActiveTab('istasyon')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'istasyon' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><Hammer size={18}/> Üretim Terminalleri</div>
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
               <Settings className="animate-spin-slow" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{activeWorkOrders.length}</h3>
            <p className="text-gray-500 font-medium mt-1">Aktif İş Emri</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
               <Component size={32} />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{boms.length}</h3>
            <p className="text-gray-500 font-medium mt-1">Tanımlı Reçete (BOM)</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
               <ShieldCheck size={32} />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{qaPending.length}</h3>
            <p className="text-gray-500 font-medium mt-1">Kalite Onayı Bekleyen</p>
          </div>
        </div>
      )}

      {activeTab === 'receteler' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Component className="text-indigo-600" /> Ürün Reçeteleri ve Ar-Ge
             </h3>
             <button onClick={() => setIsBomModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
               + Yeni Reçete Oluştur
             </button>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50/50 text-gray-500 uppercase font-medium">
                 <tr>
                   <th className="px-4 py-3">Reçete Kodu/Adı</th>
                   <th className="px-4 py-3">Hedef Ürün</th>
                   <th className="px-4 py-3">Bileşen Sayısı</th>
                   <th className="px-4 py-3">Tahmini Süre</th>
                   <th className="px-4 py-3">Durum</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {boms.length === 0 ? (
                   <tr><td colSpan={5} className="py-8 text-center text-gray-500">Kayıtlı reçete (BOM) bulunamadı.</td></tr>
                 ) : (
                   boms.map(bom => {
                     const targetProd = products.find(p => p.id === bom.targetProductId);
                     return (
                       <tr key={bom.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-medium text-gray-900">{bom.name}</td>
                         <td className="px-4 py-3">{targetProd?.name || 'Bilinmiyor'}</td>
                         <td className="px-4 py-3">{bom.items.length} Kalem</td>
                         <td className="px-4 py-3">{bom.estimatedTimeMinutes} dk</td>
                         <td className="px-4 py-3">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${bom.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                             {bom.isActive ? 'Aktif' : 'Pasif'}
                           </span>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'isemirleri' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="text-indigo-600" /> İş Emirleri ve Üretim Planlama
             </h3>
             <button onClick={() => setIsWoModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
               + Yeni İş Emri
             </button>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50/50 text-gray-500 uppercase font-medium">
                 <tr>
                   <th className="px-4 py-3">İş Emri No</th>
                   <th className="px-4 py-3">Hedef Ürün</th>
                   <th className="px-4 py-3">Miktar</th>
                   <th className="px-4 py-3">Öncelik</th>
                   <th className="px-4 py-3">Durum</th>
                   <th className="px-4 py-3 text-right">İşlemler</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {workOrders.length === 0 ? (
                   <tr><td colSpan={6} className="py-8 text-center text-gray-500">Planlanmış iş emri bulunamadı.</td></tr>
                 ) : (
                   workOrders.map(wo => {
                     const targetProd = products.find(p => p.id === wo.targetProductId);
                     return (
                       <tr key={wo.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-medium text-gray-900">{wo.id}</td>
                         <td className="px-4 py-3">{targetProd?.name || 'Bilinmiyor'}</td>
                         <td className="px-4 py-3">{wo.producedQuantity} / {wo.plannedQuantity}</td>
                         <td className="px-4 py-3">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             wo.priority === 'Kritik (Savunma/Havacılık)' ? 'bg-red-100 text-red-700' :
                             wo.priority === 'Yüksek' ? 'bg-orange-100 text-orange-700' :
                             wo.priority === 'Normal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                           }`}>
                             {wo.priority}
                           </span>
                         </td>
                         <td className="px-4 py-3">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             wo.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700' :
                             wo.status === 'Üretimde' ? 'bg-blue-100 text-blue-700' :
                             wo.status === 'Kalite Kontrol' ? 'bg-purple-100 text-purple-700' :
                             'bg-gray-100 text-gray-700'
                           }`}>
                             {wo.status}
                           </span>
                         </td>
                         <td className="px-4 py-3 text-right">
                            {wo.status === 'Planlandı' && (
                                <button className="text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-2 py-1 rounded mr-2" onClick={() => {
                                    const newWos = workOrders.map(w => w.id === wo.id ? { ...w, status: 'Üretimde' as const } : w);
                                    setWorkOrders(newWos);
                                }}>Üretime Al</button>
                            )}
                            {wo.status === 'Üretimde' && (
                                <button className="text-purple-600 hover:text-purple-800 text-xs font-medium bg-purple-50 px-2 py-1 rounded" onClick={() => {
                                    const newWos = workOrders.map(w => w.id === wo.id ? { ...w, status: 'Kalite Kontrol' as const } : w);
                                    setWorkOrders(newWos);
                                }}>Kalite Kontrole Gönder</button>
                            )}
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'kalite' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" /> Kalite Kontrol Bekleyenler (QA)
             </h3>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50/50 text-gray-500 uppercase font-medium">
                 <tr>
                   <th className="px-4 py-3">İş Emri No</th>
                   <th className="px-4 py-3">Ürün</th>
                   <th className="px-4 py-3">Üretilen Miktar</th>
                   <th className="px-4 py-3">Öncelik</th>
                   <th className="px-4 py-3 text-right">QA Onayı</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {qaPending.length === 0 ? (
                   <tr><td colSpan={5} className="py-8 text-center text-gray-500">Kalite kontrol bekleyen ürün bulunmuyor.</td></tr>
                 ) : (
                   qaPending.map(wo => {
                     const targetProd = products.find(p => p.id === wo.targetProductId);
                     return (
                       <tr key={wo.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-medium text-gray-900">{wo.id}</td>
                         <td className="px-4 py-3">{targetProd?.name || 'Bilinmiyor'}</td>
                         <td className="px-4 py-3">{wo.plannedQuantity}</td>
                         <td className="px-4 py-3">{wo.priority}</td>
                         <td className="px-4 py-3 text-right flex justify-end gap-2">
                            <button className="text-emerald-600 hover:bg-emerald-50 text-xs font-medium border border-emerald-200 px-3 py-1.5 rounded flex items-center gap-1 transition-colors" onClick={() => {
                                    handleCompleteWorkOrder(wo);
                            }}>
                                <CheckCircle size={14} /> Onayla
                            </button>
                            <button className="text-red-600 hover:bg-red-50 text-xs font-medium border border-red-200 px-3 py-1.5 rounded flex items-center gap-1 transition-colors" onClick={() => {
                                    const newWos = workOrders.map(w => w.id === wo.id ? { ...w, status: 'Üretimde' as const } : w);
                                    setWorkOrders(newWos);
                            }}>
                                <AlertTriangle size={14} /> Reddet (Rework)
                            </button>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'istasyon' && (
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl p-4 min-h-[600px] flex flex-col items-center justify-center text-white relative animate-in fade-in">
           <div className="absolute top-4 left-4 bg-indigo-600 px-3 py-1 text-xs font-bold uppercase rounded-full shadow-lg border border-indigo-500 animate-pulse">
             Üretim Sahası Terminali (Kiosk)
           </div>
           
           <div className="w-full max-w-lg space-y-8 text-center">
             <div className="mb-8">
                <Hammer size={64} className="mx-auto text-indigo-400 mb-4" />
                <h3 className="text-3xl font-black tracking-tight mb-2">İş İstasyonu Girişi</h3>
                <p className="text-gray-400 text-sm">Operatör barkod okutarak üretime başlayabilir veya tamamlayabilir.</p>
             </div>
             
             <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-inner">
               <input 
                 type="text" 
                 value={woForm.id || ''}
                 onChange={e => setWoForm({...woForm, id: e.target.value})}
                 placeholder="İş Emri (Örn: WO-10001) Okutun..." 
                 className="w-full bg-gray-900 border-2 border-indigo-500 text-white text-xl p-4 rounded-xl text-center focus:ring-4 focus:ring-indigo-500/50 outline-none placeholder:text-gray-600 font-mono"
               />
               <button 
                 onClick={() => {
                   const wo = workOrders.find(w => w.id === woForm.id);
                   if(wo) {
                     handleCompleteWorkOrder(wo);
                     setWoForm({});
                     alert("İş emri başarıyla tamamlandı ve bildirimler gönderildi.");
                   } else {
                     alert("İş emri bulunamadı.");
                   }
                 }}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 mt-4 rounded-xl shadow-xl transition-all"
               >
                 Üretimi Tamamla (Manuel Okut)
               </button>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <button className="bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 border border-emerald-800 p-4 rounded-xl font-bold transition-colors">
                  Üretime Başla
               </button>
               <button className="bg-amber-900/50 hover:bg-amber-800 text-amber-400 border border-amber-800 p-4 rounded-xl font-bold transition-colors">
                  Fire / Hata Bildir
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Bom Modal */}
      {isBomModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Yeni Ürün Reçetesi (BOM)</h3>
                <button onClick={() => setIsBomModalOpen(false)} className="text-gray-500 hover:text-red-500"><AlertTriangle size={20} className="hidden" /> ✕</button>
             </div>
             <form className="p-6 overflow-y-auto" onSubmit={(e) => {
                 e.preventDefault();
                 const newBom: BOM = {
                     id: 'BOM-' + Math.floor(Math.random()*10000),
                     targetProductId: bomForm.targetProductId!,
                     name: bomForm.name!,
                     items: bomForm.items || [],
                     isActive: true,
                     estimatedTimeMinutes: bomForm.estimatedTimeMinutes || 60
                 };
                 setBoms([...boms, newBom]);
                 setIsBomModalOpen(false);
                 setBomForm({ name: '', targetProductId: '', items: [], estimatedTimeMinutes: 60, isActive: true });
             }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reçete Adı (Varyant)</label>
                        <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={bomForm.name} onChange={e => setBomForm({...bomForm, name: e.target.value})} placeholder="Örn: Standart Montaj v1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Ürün (Çıktı)</label>
                        <select required className="w-full border border-gray-300 rounded-lg p-2" value={bomForm.targetProductId} onChange={e => setBomForm({...bomForm, targetProductId: e.target.value})}>
                            <option value="">Ürün Seçin</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Süre (Dakika)</label>
                        <input type="number" className="w-full border border-gray-300 rounded-lg p-2" value={bomForm.estimatedTimeMinutes} onChange={e => setBomForm({...bomForm, estimatedTimeMinutes: Number(e.target.value)})} />
                    </div>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bileşenler (Hammaddeler)</label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500 text-center mb-2">Bu alana hammaddeler eklenebilir. Şimdilik simüle edilmiştir.</p>
                        <button type="button" className="text-indigo-600 text-sm font-medium">+ Bileşen Ekle</button>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={() => setIsBomModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium">Reçeteyi Kaydet</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Work Order Modal */}
      {isWoModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Yeni İş Emri (Üretim Planı)</h3>
                <button onClick={() => setIsWoModalOpen(false)} className="text-gray-500 hover:text-red-500">✕</button>
             </div>
             <form className="p-6" onSubmit={(e) => {
                 e.preventDefault();
                 const selectedBom = boms.find(b => b.id === woForm.bomId);
                 if (!selectedBom) return;
                 const newWo: WorkOrder = {
                     id: 'WO-' + Math.floor(Math.random()*100000),
                     bomId: selectedBom.id,
                     targetProductId: selectedBom.targetProductId,
                     plannedQuantity: woForm.plannedQuantity || 1,
                     producedQuantity: 0,
                     status: 'Planlandı',
                     priority: woForm.priority as WorkOrder['priority'],
                 };
                 setWorkOrders([...workOrders, newWo]);
                 setIsWoModalOpen(false);
                 setWoForm({ bomId: '', plannedQuantity: 1, priority: 'Normal' });
             }}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reçete (BOM) Seçin</label>
                        <select required className="w-full border border-gray-300 rounded-lg p-2" value={woForm.bomId} onChange={e => setWoForm({...woForm, bomId: e.target.value})}>
                            <option value="">Reçete Seçin</option>
                            {boms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Üretilecek Miktar</label>
                        <input required type="number" min="1" className="w-full border border-gray-300 rounded-lg p-2" value={woForm.plannedQuantity} onChange={e => setWoForm({...woForm, plannedQuantity: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik Derecesi</label>
                        <select className="w-full border border-gray-300 rounded-lg p-2" value={woForm.priority} onChange={e => setWoForm({...woForm, priority: e.target.value as WorkOrder['priority']})}>
                            <option value="Düşük">Düşük</option>
                            <option value="Normal">Normal</option>
                            <option value="Yüksek">Yüksek</option>
                            <option value="Kritik (Savunma/Havacılık)">Kritik (Savunma/Havacılık)</option>
                        </select>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                    <button type="button" onClick={() => setIsWoModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium">İş Emri Başlat</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
