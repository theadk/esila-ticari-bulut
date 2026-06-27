import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';
import { ShoppingBag, FileCheck, CheckSquare, Plus, CheckCircle, PackageSearch, ListChecks, Download, Trash2, Edit2, X } from 'lucide-react';
import { PurchaseRequest, PurchaseRequestStatus, PurchaseRequestItem } from '../types';
import toast from 'react-hot-toast';

export const SatinAlma: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === sessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'satinalma', 'view');

  const [activeTab, setActiveTab] = useState<'talepler' | 'malkabul' | 'oneriler'>('talepler');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMalKabulModalOpen, setIsMalKabulModalOpen] = useState(false);
  const [malKabulForm, setMalKabulForm] = useState({ supplierId: '', documentNo: '', date: new Date().toISOString().split('T')[0], items: [{ productId: '', quantity: 1, price: 0 }] });
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [formData, setFormData] = useState<PurchaseRequest>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    requestedBy: currentUser?.name || '',
    items: [],
    status: 'Bekliyor'
  });

  const fetchRequests = async () => {
     try {
        const res = await fetch('/api/purchase_requests', {
           headers: { 'x-tenant-id': sessionStorage.getItem('esila_tenant_id') || '1111111111' }
        });
        if (res.ok) {
           const data = await res.json();
           const parsedData = data.map((d: any) => ({
             ...d,
             items: typeof d.items === 'string' ? JSON.parse(d.items) : (d.items || [])
           }));
           setRequests(parsedData);
           store.setPurchaseRequests?.(parsedData);
        }
     } catch (e) { console.error(e); }
  };

  const fetchRecommendations = async () => {
     try {
        const res = await fetch('/api/purchase-recommendations', {
           headers: { 'x-tenant-id': sessionStorage.getItem('esila_tenant_id') || '1111111111' }
        });
        if (res.ok) {
           setRecommendations(await res.json());
        }
     } catch (e) { console.error(e); }
  };

  useEffect(() => {
     fetchRequests();
     fetchRecommendations();
  }, []);

  const { products, customers } = store;
  const suppliers = customers.filter(c => c.type === 'Satıcı' || c.customerType === 'Tüzel');
  
  // Local fallback if API fails
  const lowStockProducts = recommendations.length > 0 ? recommendations : products.filter(p => p.stock <= (p.minStock || 0));

  const handleStatusChange = async (id: string, status: PurchaseRequestStatus) => {
     try {
        const req = requests.find(r => r.id === id);
        if (!req) return;
        const res = await fetch(`/api/purchase_requests/${id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json', 'x-tenant-id': sessionStorage.getItem('esila_tenant_id') || '1111111111' },
           body: JSON.stringify({ ...req, status })
        });
        if (res.ok) {
           toast.success('Durum güncellendi');
           fetchRequests();
        }
     } catch (e) { toast.error('Hata oluştu'); }
  };

  const saveRequest = async (e: React.FormEvent) => {
     e.preventDefault();
     if (formData.items.length === 0) return toast.error('Lütfen ürün ekleyin');
     
     try {
        const method = formData.id ? 'PUT' : 'POST';
        const url = formData.id ? `/api/purchase_requests/${formData.id}` : '/api/purchase_requests';
        const body = { ...formData, id: formData.id || `PR-${Date.now()}` };
        
        const res = await fetch(url, {
           method,
           headers: { 'Content-Type': 'application/json', 'x-tenant-id': sessionStorage.getItem('esila_tenant_id') || '1111111111' },
           body: JSON.stringify(body)
        });
        
        if (res.ok) {
           toast.success('Talep kaydedildi');
           setIsModalOpen(false);
           fetchRequests();
        }
     } catch (e) { toast.error('Hata oluştu'); }
  };

  const handleSaveMalKabul = (e: React.FormEvent) => {
     e.preventDefault();
     if(malKabulForm.items.some(i => !i.productId || i.quantity <= 0)) {
         return toast.error("Lütfen geçerli ürünler ve miktarlar girin.");
     }
     
     // Update product stocks
     const updatedProducts = [...products];
     let totalAmount = 0;
     malKabulForm.items.forEach(item => {
         const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
         if(pIdx >= 0) {
             updatedProducts[pIdx] = {
                 ...updatedProducts[pIdx],
                 stock: updatedProducts[pIdx].stock + item.quantity,
                 buyPrice: item.price > 0 ? item.price : updatedProducts[pIdx].buyPrice
             };
         }
         totalAmount += item.quantity * item.price;
     });
     store.setProducts(updatedProducts);
     
     // Log transaction & Update Supplier Balance
     if (malKabulForm.supplierId) {
         const newTransaction = {
             id: Math.random().toString(36).substr(2, 9),
             customerId: malKabulForm.supplierId,
             date: malKabulForm.date,
             type: 'Alış',
             amount: -totalAmount,
             description: `Mal Kabul İrsaliyesi: ${malKabulForm.documentNo}`
         };
         
         if (store.transactions && store.setTransactions) {
             store.setTransactions([...store.transactions, newTransaction as any]);
         }
         
         if (store.customers && store.setCustomers) {
             const updatedCustomers = store.customers.map(c => {
                 if (c.id === malKabulForm.supplierId) {
                     return { ...c, balance: c.balance - totalAmount };
                 }
                 return c;
             });
             store.setCustomers(updatedCustomers);
         }
     }
     
     // Save Waybill
     if ((store as any).setWaybills) {
        (store as any).setWaybills([
          ...((store as any).waybills || []),
          {
            id: `WB-${Date.now()}`,
            supplierId: malKabulForm.supplierId,
            documentNo: malKabulForm.documentNo,
            date: malKabulForm.date,
            items: malKabulForm.items,
            totalAmount: totalAmount
          }
        ]);
     }

     toast.success('İrsaliye kaydedildi, stoklar ve cari hesap güncellendi');
     setIsMalKabulModalOpen(false);
     setMalKabulForm({ supplierId: '', documentNo: '', date: new Date().toISOString().split('T')[0], items: [{ productId: '', quantity: 1, price: 0 }] });
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ShoppingBag size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Satın Alma modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Satın Alma ve Tedarik</h2>
          <p className="text-gray-500 text-sm mt-1">Tedarikçi siparişleri, mal kabul işlemleri ve satın alma taleplerini yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors border border-gray-200">
              <Download size={18} />
              Dışa Aktar
           </button>
           {activeTab === 'talepler' && (
              <button onClick={() => { setFormData({ id: '', date: new Date().toISOString().split('T')[0], requestedBy: currentUser?.name || '', items: [], status: 'Bekliyor' }); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                <Plus size={18} />
                <span className="hidden sm:inline">Yeni Talep</span>
              </button>
           )}
           {activeTab === 'malkabul' && (
              <button onClick={() => setIsMalKabulModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                <Plus size={18} />
                <span className="hidden sm:inline">Yeni Mal Kabul (İrsaliye)</span>
              </button>
           )}
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('talepler')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'talepler' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Satın Alma Talepleri
        </button>
        <button
          onClick={() => setActiveTab('malkabul')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'malkabul' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Mal Kabul (İrsaliye)
        </button>
        <button
          onClick={() => setActiveTab('oneriler')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'oneriler' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Sipariş Önerileri <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs">{lowStockProducts.length}</span>
        </button>
      </div>

      {activeTab === 'talepler' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
           {requests.length === 0 ? (
             <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                   <FileCheck size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Talep ve Onay Sistemi</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">Personelin girdiği satın alma taleplerini yönetin. Onaylanan talepler otomatik olarak tedarikçi siparişine dönüşür.</p>
                <button onClick={() => { setFormData({ id: '', date: new Date().toISOString().split('T')[0], requestedBy: currentUser?.name || '', items: [], status: 'Bekliyor' }); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
                  <Plus size={18} /> Yeni Satın Alma Talebi
                </button>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50/50 text-gray-500 uppercase font-medium">
                   <tr>
                     <th className="px-4 py-3">Tarih</th>
                     <th className="px-4 py-3">Talep Eden</th>
                     <th className="px-4 py-3">Ürün/Adet</th>
                     <th className="px-4 py-3">Durum</th>
                     <th className="px-4 py-3 text-right">İşlem</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {requests.map(req => (
                     <tr key={req.id} className="hover:bg-gray-50">
                       <td className="px-4 py-3">{new Date(req.date).toLocaleDateString('tr-TR')}</td>
                       <td className="px-4 py-3 font-medium text-gray-900">{req.requestedBy}</td>
                       <td className="px-4 py-3">{req.items.length} Kalem Ürün</td>
                       <td className="px-4 py-3">
                         <span className={`px-2 py-1 rounded text-xs font-semibold ${req.status === 'Onaylandı' ? 'bg-emerald-100 text-emerald-700' : req.status === 'Reddedildi' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {req.status}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-right space-x-2 flex justify-end">
                          {req.status === 'Bekliyor' && (
                             <>
                               <button onClick={() => handleStatusChange(req.id, 'Onaylandı')} className="text-emerald-600 hover:text-emerald-800" title="Onayla"><CheckCircle size={18}/></button>
                               <button onClick={() => handleStatusChange(req.id, 'Reddedildi')} className="text-red-600 hover:text-red-800" title="Reddet"><X size={18}/></button>
                             </>
                          )}
                          <button onClick={() => { setFormData(req); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800" title="Görüntüle/Düzenle"><Edit2 size={18}/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
      )}

      {activeTab === 'malkabul' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ListChecks size={32} />
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">Mal Kabul (İrsaliye) İşlemleri</h3>
             <p className="text-gray-500 max-w-md mx-auto mb-6">Tedarikçiden gelen irsaliyeleri sisteme girin, siparişlerle eşleştirerek stokları otomatik güncelleyin.</p>
             <button onClick={() => setIsMalKabulModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
               <Plus size={18} /> Yeni İrsaliye (Mal Kabul)
             </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   Geçmiş İrsaliyeler
                </h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50/50 text-gray-500 uppercase font-medium">
                   <tr>
                     <th className="px-4 py-3">Tarih</th>
                     <th className="px-4 py-3">Belge No</th>
                     <th className="px-4 py-3">Tedarikçi</th>
                     <th className="px-4 py-3">Kalem Sayısı</th>
                     <th className="px-4 py-3 text-right">Toplam Tutar</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {((store as any).waybills || []).length === 0 ? (
                     <tr>
                       <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                         Henüz irsaliye kaydı bulunmuyor.
                       </td>
                     </tr>
                   ) : (
                     ((store as any).waybills || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((wb: any) => {
                       const supplier = suppliers.find(s => s.id === wb.supplierId);
                       return (
                         <tr key={wb.id} className="hover:bg-gray-50">
                           <td className="px-4 py-3">{new Date(wb.date).toLocaleDateString('tr-TR')}</td>
                           <td className="px-4 py-3 font-medium text-gray-900">{wb.documentNo}</td>
                           <td className="px-4 py-3">{supplier?.companyName || supplier?.name || wb.supplierId}</td>
                           <td className="px-4 py-3">{wb.items?.length || 0} Kalem</td>
                           <td className="px-4 py-3 text-right font-medium">₺{(wb.totalAmount || 0).toLocaleString('tr-TR')}</td>
                         </tr>
                       );
                     })
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'oneriler' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
           <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <PackageSearch className="text-red-500" size={20} />
                 Kritik Stok Seviyesindeki Ürünler
              </h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50/50 text-gray-500 uppercase font-medium">
                 <tr>
                   <th className="px-4 py-3">Ürün Kodu</th>
                   <th className="px-4 py-3">Ürün Adı</th>
                   <th className="px-4 py-3">Mevcut Stok</th>
                   <th className="px-4 py-3">Min. Stok</th>
                   <th className="px-4 py-3">Tedarikçi</th>
                   <th className="px-4 py-3 text-right">İşlem</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {lowStockProducts.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                       Kritik stok seviyesine düşen ürün bulunmuyor.
                     </td>
                   </tr>
                 ) : (
                   lowStockProducts.map(product => (
                     <tr key={product.id} className="hover:bg-gray-50">
                       <td className="px-4 py-3 font-medium text-gray-900">{product.code}</td>
                       <td className="px-4 py-3">{product.name}</td>
                       <td className="px-4 py-3">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                             {product.stock}
                          </span>
                       </td>
                       <td className="px-4 py-3 text-gray-500">{product.minStock}</td>
                       <td className="px-4 py-3 text-gray-500">Otomatik Tedarikçi</td>
                       <td className="px-4 py-3 text-right">
                         <button 
                           onClick={() => {
                             setFormData({
                               id: '',
                               date: new Date().toISOString().split('T')[0],
                               requestedBy: currentUser?.name || '',
                               items: [{ productId: product.id, productName: product.name, quantity: Math.max(1, (product.minStock || 0) - product.stock) }],
                               status: 'Bekliyor'
                             });
                             setActiveTab('talepler');
                             setIsModalOpen(true);
                           }}
                           className="text-emerald-600 hover:text-emerald-800 font-medium text-xs flex items-center gap-1 justify-end ml-auto"
                         >
                            <ShoppingBag size={14} /> Tedarikçiden İste
                         </button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center p-6 border-b">
               <h2 className="text-xl font-semibold">Satın Alma Talebi</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
             </div>
             <form onSubmit={saveRequest} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                      <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Talep Eden</label>
                      <input type="text" required value={formData.requestedBy} onChange={e => setFormData({...formData, requestedBy: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Ürünler</label>
                      <button type="button" onClick={() => setFormData({...formData, items: [...formData.items, { productId: '', productName: '', quantity: 1 }]})} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                         <Plus size={14} /> Ürün Ekle
                      </button>
                   </div>
                   {formData.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center mb-2">
                         <select required value={item.productId} onChange={e => {
                            const selectedProd = products.find(p => p.id === e.target.value);
                            const newItems = [...formData.items];
                            newItems[idx].productId = e.target.value;
                            newItems[idx].productName = selectedProd?.name || e.target.value;
                            setFormData({...formData, items: newItems});
                         }} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                            <option value="">Ürün Seçin...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                         <input type="number" min="1" placeholder="Miktar" required value={item.quantity} onChange={e => {
                            const newItems = [...formData.items];
                            newItems[idx].quantity = Number(e.target.value);
                            setFormData({...formData, items: newItems});
                         }} className="w-24 border rounded-lg px-3 py-2 text-sm" />
                         <button type="button" onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== idx);
                            setFormData({...formData, items: newItems});
                         }} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                      </div>
                   ))}
                   {formData.items.length === 0 && <p className="text-sm text-gray-500 italic">Henüz ürün eklenmedi.</p>}
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                   <textarea rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border rounded-lg px-3 py-2"></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                   <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Kaydet</button>
                </div>
             </form>
          </div>
        </div>
      )}
      {isMalKabulModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center p-6 border-b">
               <h2 className="text-xl font-semibold">Yeni Mal Kabul (İrsaliye)</h2>
               <button onClick={() => setIsMalKabulModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
             </div>
             <form onSubmit={handleSaveMalKabul} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi</label>
                      <select required value={malKabulForm.supplierId} onChange={e => setMalKabulForm({...malKabulForm, supplierId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                         <option value="">Seçiniz...</option>
                         {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName || s.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                      <input type="date" required value={malKabulForm.date} onChange={e => setMalKabulForm({...malKabulForm, date: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">İrsaliye / Belge No</label>
                      <input type="text" required value={malKabulForm.documentNo} onChange={e => setMalKabulForm({...malKabulForm, documentNo: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Örn: IRS-2023-0001" />
                   </div>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Gelen Ürünler</label>
                      <button type="button" onClick={() => setMalKabulForm({...malKabulForm, items: [...malKabulForm.items, { productId: '', quantity: 1, price: 0 }]})} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                         <Plus size={14} /> Ürün Ekle
                      </button>
                   </div>
                   {malKabulForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center mb-2">
                         <select required value={item.productId} onChange={e => {
                            const newItems = [...malKabulForm.items];
                            newItems[idx].productId = e.target.value;
                            setMalKabulForm({...malKabulForm, items: newItems});
                         }} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                            <option value="">Ürün Seçin...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
                         </select>
                         <input type="number" min="1" placeholder="Adet" required value={item.quantity} onChange={e => {
                            const newItems = [...malKabulForm.items];
                            newItems[idx].quantity = Number(e.target.value);
                            setMalKabulForm({...malKabulForm, items: newItems});
                         }} className="w-24 border rounded-lg px-3 py-2 text-sm" />
                         <input type="number" min="0" step="0.01" placeholder="Birim Fiyat" value={item.price} onChange={e => {
                            const newItems = [...malKabulForm.items];
                            newItems[idx].price = Number(e.target.value);
                            setMalKabulForm({...malKabulForm, items: newItems});
                         }} className="w-28 border rounded-lg px-3 py-2 text-sm" />
                         <button type="button" onClick={() => {
                            const newItems = malKabulForm.items.filter((_, i) => i !== idx);
                            setMalKabulForm({...malKabulForm, items: newItems});
                         }} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                      </div>
                   ))}
                   {malKabulForm.items.length === 0 && <p className="text-sm text-gray-500 italic">Henüz ürün eklenmedi.</p>}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t">
                   <button type="button" onClick={() => setIsMalKabulModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                   <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Stokları Güncelle ve Kaydet</button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};
