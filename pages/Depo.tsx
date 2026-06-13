import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Package, Search, Box, ArrowRight, Plus, X, Edit2, Trash2, ArrowLeftRight } from 'lucide-react';
import { Product, Warehouse, StockTransfer } from '../types';
import { api } from '../lib/api';
import { Pagination } from '../components/Pagination';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';

export const Depo: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'depo', 'view');
  const canCreate = hasPermission(currentUser, 'depo', 'create');
  const canEdit = hasPermission(currentUser, 'depo', 'edit');
  const canDelete = hasPermission(currentUser, 'depo', 'delete');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouse, setActiveWarehouse] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newWh, setNewWh] = useState<Warehouse>({ id: '', name: '', address: '', capacity: 0 });

  const [activeTab, setActiveTab] = useState<'depolar'|'transferler'>('depolar');
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ productId: '', sourceWarehouse: '', targetWarehouse: '', quantity: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [whs, prds, trs] = await Promise.all([api.getWarehouses(), api.getProducts(), api.getStockTransfers()]);
      const availableWhs = currentUser?.assignedWarehouse 
        ? whs.filter(w => w.id === currentUser.assignedWarehouse)
        : whs;
      setAllWarehouses(whs);
      setWarehouses(availableWhs);
      setProducts(prds);
      setTransfers(trs);
      if (availableWhs.length > 0 && !activeWarehouse) {
        setActiveWarehouse(availableWhs[0].name);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddOrEditWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateWarehouse(newWh.id, newWh);
        if (newWh.name !== activeWarehouse) {
          setActiveWarehouse(newWh.name);
        }
      } else {
        const whToSave = { ...newWh, id: String(Date.now()) };
        await api.addWarehouse(whToSave);
      }
      await loadData();
      setIsModalOpen(false);
      setNewWh({ id: '', name: '', address: '', capacity: 0 });
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save warehouse', e);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.productId || !transferForm.sourceWarehouse || !transferForm.targetWarehouse) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }
    if (transferForm.sourceWarehouse === transferForm.targetWarehouse) {
      alert('Kaynak ve hedef depo aynı olamaz.');
      return;
    }
    if (transferForm.quantity <= 0) {
      alert('Geçerli bir miktar girin.');
      return;
    }

    const prd = products.find(p => p.id === transferForm.productId);
    if (!prd) return;

    let available = 0;
    if (prd.warehouseStocks && prd.warehouseStocks.length > 0) {
       available = prd.warehouseStocks.find(w => w.warehouseId === transferForm.sourceWarehouse)?.stock || 0;
    } else {
       if (prd.warehouse === transferForm.sourceWarehouse) available = prd.stock;
    }

    if (available < transferForm.quantity) {
       alert(`Kaynak depoda yeterli stok yok. Mevcut: ${available}`);
       return;
    }

    try {
      await api.addStockTransfer({
         id: String(Date.now()),
         productId: transferForm.productId,
         productName: prd.name,
         sourceWarehouse: transferForm.sourceWarehouse,
         targetWarehouse: transferForm.targetWarehouse,
         quantity: transferForm.quantity,
         date: new Date().toISOString(),
         personnelName: store.users?.[0] ? store.users[0].name : 'Admin'
      });
      await loadData();
      setIsTransferModalOpen(false);
      setTransferForm({ productId: '', sourceWarehouse: '', targetWarehouse: '', quantity: 1 });
      alert('Stok transferi başarıyla gerçekleşti.');
    } catch(err) {
      alert('Stok transferi sırasında hata oluştu.');
    }
  };

  const openEditModal = (whStatName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const whToEdit = warehouses.find(w => w.name === whStatName);
    if (whToEdit) {
      setNewWh(whToEdit);
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const handleDeleteWarehouse = async (whStatName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const hasProducts = products.some(p => 
      p.warehouse === whStatName || 
      (p.warehouseStocks && p.warehouseStocks.some(ws => ws.warehouseId === whStatName && ws.stock > 0))
    );
    if (hasProducts) {
      // alert blocked by iframe
      return;
    }

    try {
      const whToDelete = warehouses.find(w => w.name === whStatName);
      if (whToDelete) {
        await api.deleteWarehouse(whToDelete.id);
        const whs = await api.getWarehouses();
        setWarehouses(whs);
        if (activeWarehouse === whStatName) {
          setActiveWarehouse(whs.length > 0 ? whs[0].name : '');
        }
      }
    } catch (error) {
      console.error('Failed to delete warehouse', error);
    }
  };

  const warehouseStats = (warehouses || []).map(wh => {
    const whProducts = (products || []).filter(p => 
      p.warehouse === wh.name || 
      (p.warehouseStocks && p.warehouseStocks.some(ws => ws.warehouseId === wh.name))
    );
    const uniqueItems = whProducts.length;
    const totalStock = whProducts.reduce((sum, p) => {
       if (p.warehouseStocks && p.warehouseStocks.length > 0) {
          const ws = p.warehouseStocks.find(ws => ws.warehouseId === wh.name);
          return sum + (ws ? ws.stock : 0);
       }
       return sum + p.stock;
    }, 0);
    return { name: wh.name, uniqueItems, totalStock };
  });

  const filteredProducts = (products || []).filter(p => {
    const isInWh = p.warehouse === activeWarehouse || (p.warehouseStocks && p.warehouseStocks.some(ws => ws.warehouseId === activeWarehouse));
    if (!isInWh) return false;
    const searchMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.barcode && p.barcode.includes(searchTerm));
    return searchMatch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = itemsPerPage === -1 ? filteredProducts : filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeWarehouse]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Depo modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Depo Yönetimi</h2>
        
        <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('depolar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'depolar' ? 'bg-emerald-100 text-emerald-700' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              Depolar
            </button>
            <button 
              onClick={() => setActiveTab('transferler')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'transferler' ? 'bg-emerald-100 text-emerald-700' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              Stok Transferleri
            </button>
        </div>

        <div className="flex gap-2">
            {canCreate && (
              activeTab === 'depolar' ? (
                  <button 
                    onClick={() => {
                      setNewWh({ id: '', name: '', address: '', capacity: 0 });
                      setIsEditing(false);
                      setIsModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    <span>Yeni Depo Ekle</span>
                  </button>
              ) : (
                  <button 
                    onClick={() => setIsTransferModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <ArrowLeftRight size={18} />
                    <span>Stok Transferi Yap</span>
                  </button>
              )
            )}
        </div>
      </div>

      {activeTab === 'depolar' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {warehouseStats.map((stat) => (
          <div 
            key={stat.name}
            onClick={() => setActiveWarehouse(stat.name)}
            className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 relative group ${
              activeWarehouse === stat.name 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform -translate-y-1' 
                : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm text-gray-700'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${activeWarehouse === stat.name ? 'bg-emerald-500/50 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                <WarehouseIcon size={24} />
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button 
                    onClick={(e) => openEditModal(stat.name, e)}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${activeWarehouse === stat.name ? 'hover:bg-emerald-500 text-emerald-100 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                    title="Düzenle"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {canDelete && (
                  <button 
                    onClick={(e) => handleDeleteWarehouse(stat.name, e)}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${activeWarehouse === stat.name ? 'hover:bg-emerald-500 text-emerald-100 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'}`}
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {activeWarehouse === stat.name && <ArrowRight size={20} className="hidden sm:block opacity-80" />}
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">{stat.name}</h3>
            <div className={`text-sm flex gap-4 ${activeWarehouse === stat.name ? 'text-emerald-100' : 'text-gray-500'}`}>
               <div><span className="font-medium">{stat.uniqueItems}</span> Çeşit</div>
               <div><span className="font-medium">{stat.totalStock}</span> Adet</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Box className="text-emerald-600" size={20} />
            {activeWarehouse} Ürünleri
          </h3>
          <div className="relative w-full max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Depoda ara (isim, kod, barkod)..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
            <tr>
              <th className="px-6 py-4">Ürün Kodu</th>
              <th className="px-6 py-4">Barkod</th>
              <th className="px-6 py-4">Ürün Adı</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4 text-right">Mevcut Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Bu depoda kayıtlı ürün bulunamadı.
                  </td>
                </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">
                    {product.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.barcode || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                       {(() => {
                         const stock = (product.warehouseStocks && product.warehouseStocks.length > 0) ? (product.warehouseStocks.find(ws => ws.warehouseId === activeWarehouse)?.stock || 0) : product.stock;
                         return stock === 0 ? (
                           <span className="text-red-500 font-medium">0</span>
                         ) : stock < 10 ? (
                           <span className="text-orange-500 font-medium">{stock}</span>
                         ) : (
                           <span className="text-emerald-600 font-medium">{stock}</span>
                         );
                       })()}
                       <span className="text-gray-400 text-sm">adet</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredProducts.length}
      />
      </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-800">Geçmiş Stok Transferleri</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Ürün</th>
                <th className="px-6 py-4">Kaynak Depo</th>
                <th className="px-6 py-4">Hedef Depo</th>
                <th className="px-6 py-4">Miktar</th>
                <th className="px-6 py-4">İşlemi Yapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                     Kayıtlı transfer işlemi bulunmamaktadır.
                   </td>
                 </tr>
              ) : (
                transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                       {new Date(t.date).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                       {t.productName}
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md font-medium">{t.sourceWarehouse}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md font-medium">{t.targetWarehouse}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">
                       {t.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                       {t.personnelName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{isEditing ? 'Depo Düzenle' : 'Yeni Depo Ekle'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddOrEditWarehouse} className="p-4 sm:p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depo Adı</label>
                  <input 
                    required
                    type="text" 
                    value={newWh.name}
                    onChange={(e) => setNewWh({...newWh, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <input 
                    type="text" 
                    value={newWh.address}
                    onChange={(e) => setNewWh({...newWh, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite</label>
                  <input 
                    type="number" 
                    value={newWh.capacity || ''}
                    onChange={(e) => setNewWh({...newWh, capacity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </div>

               <div className="pt-4 flex justify-end gap-3">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                  İptal
                 </button>
                 <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                 >
                  {isEditing ? 'Güncelle' : 'Kaydet'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Stok Transferi Yap</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-4 sm:p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Seçin</label>
                  <select
                    required
                    value={transferForm.productId}
                    onChange={(e) => setTransferForm({...transferForm, productId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Ürün Seçin --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak Depo</label>
                  <select
                    required
                    value={transferForm.sourceWarehouse}
                    onChange={(e) => setTransferForm({...transferForm, sourceWarehouse: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Kaynak Depo Seçin --</option>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Depo</label>
                  <select
                    required
                    value={transferForm.targetWarehouse}
                    onChange={(e) => setTransferForm({...transferForm, targetWarehouse: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Hedef Depo Seçin --</option>
                    {allWarehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miktar</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({...transferForm, quantity: Number(e.target.value) || 1})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </div>

               <div className="pt-4 flex justify-end gap-3">
                 <button 
                  type="button" 
                  onClick={() => setIsTransferModalOpen(false)} 
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                  İptal
                 </button>
                 <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                 >
                  Transferi Başlat
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
