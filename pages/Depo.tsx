import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Package, Search, Box, ArrowRight, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { Product, Warehouse } from '../types';
import { api } from '../lib/api';

export const Depo: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouse, setActiveWarehouse] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newWh, setNewWh] = useState<Warehouse>({ id: '', name: '', address: '', capacity: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [whs, prds] = await Promise.all([api.getWarehouses(), api.getProducts()]);
      setWarehouses(whs);
      setProducts(prds);
      if (whs.length > 0 && !activeWarehouse) {
        setActiveWarehouse(whs[0].name);
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
    
    const hasProducts = products.some(p => p.warehouse === whStatName);
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
    const whProducts = (products || []).filter(p => p.warehouse === wh.name);
    const uniqueItems = whProducts.length;
    const totalStock = whProducts.reduce((sum, p) => sum + p.stock, 0);
    return { name: wh.name, uniqueItems, totalStock };
  });

  const filteredProducts = (products || []).filter(p => 
    p.warehouse === activeWarehouse &&
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (p.barcode && p.barcode.includes(searchTerm)))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Depo Yönetimi</h2>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <button 
                  onClick={(e) => openEditModal(stat.name, e)}
                  className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${activeWarehouse === stat.name ? 'hover:bg-emerald-500 text-emerald-100 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                  title="Düzenle"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDeleteWarehouse(stat.name, e)}
                  className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${activeWarehouse === stat.name ? 'hover:bg-emerald-500 text-emerald-100 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'}`}
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
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
          <div className="relative w-full max-w-md">
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
            {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Bu depoda kayıtlı ürün bulunamadı.
                  </td>
                </tr>
            ) : (
              filteredProducts.map((product) => (
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
                       {product.stock === 0 ? (
                         <span className="text-red-500 font-medium">0</span>
                       ) : product.stock < 10 ? (
                         <span className="text-orange-500 font-medium">{product.stock}</span>
                       ) : (
                         <span className="text-emerald-600 font-medium">{product.stock}</span>
                       )}
                       <span className="text-gray-400 text-sm">adet</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{isEditing ? 'Depo Düzenle' : 'Yeni Depo Ekle'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddOrEditWarehouse} className="p-6 space-y-4">
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
    </div>
  );
};
