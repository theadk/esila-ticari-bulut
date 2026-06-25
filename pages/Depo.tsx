import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Package, Search, Box, ArrowRight, Plus, X, Edit2, Trash2, ArrowLeftRight, ScanBarcode, Truck, MapPin, Map, Navigation, Layers, CheckSquare } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'depolar'|'transferler'|'akilli_depo'|'el_terminali'>('depolar');
  const [smartWarehouseView, setSmartWarehouseView] = useState<'barkod'|'sevkiyat'|'yerlesim'>('barkod');
  const [barcodeScan, setBarcodeScan] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ productId: '', sourceWarehouse: '', targetWarehouse: '', quantity: 1 });
  const [locationForm, setLocationForm] = useState({ productId: '', aisle: 'A', shelf: '1' });

  // Akıllı Toplama Rotası State
  const [pickingList, setPickingList] = useState([
    { id: '1', name: 'Ürün XYZ', aisle: 'A', shelf: 3, qty: 2, picked: false },
    { id: '2', name: 'Ürün ABC', aisle: 'C', shelf: 2, qty: 5, picked: false },
    { id: '3', name: 'Kutu KMN', aisle: 'C', shelf: 5, qty: 1, picked: false },
    { id: '4', name: 'Yedek Parça', aisle: 'B', shelf: 1, qty: 10, picked: false },
    { id: '5', name: 'Kablo 2m', aisle: 'A', shelf: 1, qty: 3, picked: false },
  ]);
  const [isRouteOptimized, setIsRouteOptimized] = useState(false);
  const [terminalMode, setTerminalMode] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');

  const optimizeRoute = () => {
    const aisleOrder: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    const sorted = [...pickingList].sort((a, b) => {
      if (a.aisle !== b.aisle) {
        return aisleOrder[a.aisle] - aisleOrder[b.aisle];
      }
      const isEvenAisle = aisleOrder[a.aisle] % 2 === 0;
      return isEvenAisle ? a.shelf - b.shelf : b.shelf - a.shelf;
    });
    setPickingList(sorted);
    setIsRouteOptimized(true);
  };

  const togglePicked = (id: string) => {
    setPickingList(list => list.map(item => item.id === id ? { ...item, picked: !item.picked } : item));
  };

  const getAisleShelfCoords = (aisle: string, shelf: number) => {
     // Aisle centers: A:75, B:225, C:375, D:525 (Approximate based on grid layout 600px width / 4)
     const xMap: Record<string, number> = { 'A': 75, 'B': 225, 'C': 375, 'D': 525 };
     // Shelf centers (1-5 top to bottom)
     const yMap: Record<number, number> = { 1: 50, 2: 120, 3: 190, 4: 260, 5: 330 };
     return { x: xMap[aisle] || 0, y: yMap[shelf] || 0 };
  };

  const generateDynamicPath = () => {
    const unpicked = pickingList.filter(p => !p.picked);
    if (unpicked.length === 0) return '';
    let path = `M 40,380`; 
    let currentX = 40;
    let currentY = 380;
    unpicked.forEach(item => {
      const { x, y } = getAisleShelfCoords(item.aisle, item.shelf);
      path += ` L ${x},${currentY} L ${x},${y}`;
      currentX = x;
      currentY = y;
    });
    return path;
  };

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

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.productId) {
      alert('Lütfen bir ürün seçin.');
      return;
    }
    const prd = products.find(p => p.id === locationForm.productId);
    if (!prd) return;

    try {
      const updatedProduct = { ...prd, aisle: locationForm.aisle, shelf: locationForm.shelf };
      await api.updateProduct(prd.id, updatedProduct);
      
      // Update local state directly for immediate feedback
      setProducts(products.map(p => p.id === prd.id ? updatedProduct : p));
      alert('Ürün konumu başarıyla güncellendi.');
    } catch (error) {
      console.error(error);
      alert('Konum güncellenirken bir hata oluştu.');
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

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeScan.trim()) return;
    const found = products.find(p => p.barcode === barcodeScan.trim() || p.code === barcodeScan.trim());
    if (found) {
      setScannedProduct(found);
    } else {
      setScannedProduct(null);
      alert('Bu barkoda ait ürün bulunamadı.');
    }
    setBarcodeScan('');
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
            <button 
              onClick={() => setActiveTab('akilli_depo')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'akilli_depo' ? 'bg-emerald-100 text-emerald-700' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              Akıllı Depo
            </button>
            <button 
              onClick={() => setActiveTab('el_terminali')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'el_terminali' ? 'bg-emerald-100 text-emerald-700' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              El Terminali (WMS)
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
      ) : activeTab === 'transferler' ? (
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
      ) : activeTab === 'akilli_depo' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Smart Warehouse Sub Nav */}
          <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSmartWarehouseView('barkod')}
              className={`pb-4 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${smartWarehouseView === 'barkod' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <ScanBarcode size={18} />
                Barkod İşlemleri
              </div>
            </button>
            <button
              onClick={() => setSmartWarehouseView('sevkiyat')}
              className={`pb-4 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${smartWarehouseView === 'sevkiyat' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <Truck size={18} />
                Sevkiyat Yönetimi
              </div>
            </button>
            <button
              onClick={() => setSmartWarehouseView('yerlesim')}
              className={`pb-4 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${smartWarehouseView === 'yerlesim' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                Raf ve Yerleşim
              </div>
            </button>
          </div>

          {smartWarehouseView === 'barkod' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10"></div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ScanBarcode className="text-emerald-600" /> Ürün Sorgula (Barkod Okuyucu)</h3>
                <form onSubmit={handleBarcodeScan} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Barkod okutun veya kod girin..."
                    value={barcodeScan}
                    onChange={(e) => setBarcodeScan(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-mono text-lg"
                  />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">Sorgula</button>
                </form>
                <div className="mt-4 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 items-start">
                   <div className="mt-0.5 text-blue-500"><Search size={16}/></div>
                   <p>Barkod okuyucunuzu bağlayın ve imleci kutucuğa bırakın. Okuma tamamlandığında ürün bilgileri otomatik olarak aranacaktır.</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
                <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2"><Package className="text-blue-600" /> Sorgu Sonucu</h3>
                {scannedProduct ? (
                  <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-500">Ürün Adı:</span>
                      <span className="font-bold text-gray-800 text-right">{scannedProduct.name}</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-500">Barkod / Kod:</span>
                      <span className="font-mono text-emerald-600 font-bold">{scannedProduct.barcode || scannedProduct.code || '-'}</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-500">Toplam Stok:</span>
                      <span className="font-bold text-lg bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg">{scannedProduct.stock} {scannedProduct.unit}</span>
                    </div>
                    <div className="pt-2">
                      <h4 className="font-medium text-sm text-gray-600 mb-2">Depo Dağılımı:</h4>
                      {scannedProduct.warehouseStocks && scannedProduct.warehouseStocks.length > 0 ? (
                        <div className="space-y-2">
                          {scannedProduct.warehouseStocks.map((ws, i) => (
                            <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <div className="flex items-center gap-2">
                                <WarehouseIcon size={16} className="text-gray-400" />
                                <span className="font-medium text-gray-700">{ws.warehouseId}</span>
                              </div>
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-sm">{ws.stock}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                             <WarehouseIcon size={16} className="text-gray-400" />
                             <span className="font-medium text-gray-700">{scannedProduct.warehouse || 'Varsayılan Depo'}</span>
                          </div>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-sm">{scannedProduct.stock}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <ScanBarcode size={48} className="mb-2 opacity-50" />
                    <p>Henüz ürün okutulmadı</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {smartWarehouseView === 'sevkiyat' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center py-16 animate-in fade-in">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Truck size={40} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sevkiyat Yönetimi</h3>
              <p className="text-gray-500 max-w-md mx-auto">Sevkiyat modülü ile depodan çıkan ürünlerin araçlara yüklenmesi, irsaliye oluşturulması ve teslimat takibini yapabilirsiniz. Yakında aktif edilecektir.</p>
            </div>
          )}

          {smartWarehouseView === 'yerlesim' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Map className="text-emerald-600" /> Depo Haritası (2D Görünüm)
                   </h3>
                   <div className="flex gap-2">
                     <button className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded border border-emerald-200">2D Plan</button>
                     <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded border border-gray-200 hover:bg-gray-200 transition-colors">3D Görünüm (Pro)</button>
                   </div>
                </div>
                
                {/* Simulated 2D Map */}
                <div className="flex-1 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-4 min-h-[400px] relative overflow-x-auto">
                   <div className="absolute top-4 left-4 text-xs font-bold text-gray-400">GİRİŞ / SEVKİYAT ALANI</div>
                   
                   {/* Map Grid Container */}
                   <div className="mt-8 grid grid-cols-4 gap-6 h-[400px] min-w-[600px] pb-8 pt-4 relative">
                     {/* Route Line Overlay */}
                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <circle cx="40" cy="380" r="6" fill="#10b981" />
                        {(products || []).filter(p => p.aisle && p.shelf && (!activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse))).map(item => {
                           const coords = getAisleShelfCoords(item.aisle!, parseInt(item.shelf!));
                           return <circle key={`dot-${item.id}`} cx={coords.x} cy={coords.y} r="8" fill="#3b82f6" className="animate-pulse" />
                        })}
                     </svg>

                     {/* Koridor A */}
                     <div className="flex flex-col h-full gap-2 relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500">Koridor A</div>
                        {[1, 2, 3, 4, 5].map(raf => {
                           const items = (products || []).filter(p => p.aisle === 'A' && p.shelf === raf.toString() && (!activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse)));
                           const hasItems = items.length > 0;
                           return (
                              <div key={raf} className={`flex-1 rounded border-2 flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] ${hasItems ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50'}`}>
                                 A-{raf}
                                 {hasItems && <span className="bg-emerald-500 text-white text-[9px] px-1.5 rounded-full mt-1">{items.length}</span>}
                              </div>
                           )
                        })}
                     </div>
                     {/* Koridor B */}
                     <div className="flex flex-col h-full gap-2 relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500">Koridor B</div>
                        {[1, 2, 3, 4, 5].map(raf => {
                           const items = (products || []).filter(p => p.aisle === 'B' && p.shelf === raf.toString() && (!activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse)));
                           const hasItems = items.length > 0;
                           return (
                              <div key={raf} className={`flex-1 rounded border-2 flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] ${hasItems ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50'}`}>
                                 B-{raf}
                                 {hasItems && <span className="bg-emerald-500 text-white text-[9px] px-1.5 rounded-full mt-1">{items.length}</span>}
                              </div>
                           )
                        })}
                     </div>
                     {/* Koridor C */}
                     <div className="flex flex-col h-full gap-2 relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500">Koridor C</div>
                        {[1, 2, 3, 4, 5].map(raf => {
                           const items = (products || []).filter(p => p.aisle === 'C' && p.shelf === raf.toString() && (!activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse)));
                           const hasItems = items.length > 0;
                           return (
                              <div key={raf} className={`flex-1 rounded border-2 flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] ${hasItems ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50'}`}>
                                 C-{raf}
                                 {hasItems && <span className="bg-emerald-500 text-white text-[9px] px-1.5 rounded-full mt-1">{items.length}</span>}
                              </div>
                           )
                        })}
                     </div>
                     {/* Koridor D */}
                     <div className="flex flex-col h-full gap-2 relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500">Koridor D</div>
                        {[1, 2, 3, 4, 5].map(raf => {
                           const items = (products || []).filter(p => p.aisle === 'D' && p.shelf === raf.toString() && (!activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse)));
                           const hasItems = items.length > 0;
                           return (
                              <div key={raf} className={`flex-1 rounded border-2 flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] ${hasItems ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50'}`}>
                                 D-{raf}
                                 {hasItems && <span className="bg-emerald-500 text-white text-[9px] px-1.5 rounded-full mt-1">{items.length}</span>}
                              </div>
                           )
                        })}
                     </div>
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1">
                   <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin className="text-emerald-600" size={20} /> Ürün Konum Yönetimi</h3>
                   <p className="text-xs text-gray-500 mb-6">Ürünlerinizi depo içerisindeki koridor ve raf koordinatlarına atayarak harita üzerinde görselleştirin.</p>
                   
                   <form onSubmit={handleUpdateLocation} className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Seçin</label>
                         <select
                           required
                           value={locationForm.productId}
                           onChange={(e) => setLocationForm({...locationForm, productId: e.target.value})}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                         >
                           <option value="">-- Ürün Seçin --</option>
                           {(products || []).filter(p => !activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse)).map(p => (
                             <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                           ))}
                         </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Koridor</label>
                            <select
                              required
                              value={locationForm.aisle}
                              onChange={(e) => setLocationForm({...locationForm, aisle: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="A">Koridor A</option>
                              <option value="B">Koridor B</option>
                              <option value="C">Koridor C</option>
                              <option value="D">Koridor D</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Raf No</label>
                            <select
                              required
                              value={locationForm.shelf}
                              onChange={(e) => setLocationForm({...locationForm, shelf: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n.toString()}>{n}</option>)}
                            </select>
                         </div>
                      </div>

                      <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 transition-colors shadow-sm mt-4">
                        Konumu Kaydet
                      </button>
                   </form>

                   <div className="mt-8 border-t border-gray-100 pt-6">
                      <h4 className="font-bold text-sm text-gray-800 mb-4">Haritadaki Ürünler</h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar pr-2">
                        {(products || []).filter(p => p.aisle && p.shelf && (!activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse))).map(p => (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                             <div>
                                <div className="font-medium text-sm text-gray-800">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.code}</div>
                             </div>
                             <div className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-xs font-bold text-gray-700 flex items-center gap-1">
                               {p.aisle}-{p.shelf}
                             </div>
                          </div>
                        ))}
                        {!(products || []).some(p => p.aisle && p.shelf && (!activeWarehouse || p.warehouse === activeWarehouse || p.warehouseStocks?.some(ws => ws.warehouseId === activeWarehouse))) && (
                          <div className="text-center p-4 text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Henüz konumu belirlenmiş ürün yok.
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : activeTab === 'el_terminali' ? (
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl p-4 min-h-[600px] flex flex-col items-center justify-center text-white relative">
          <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 text-xs font-bold uppercase rounded-full shadow-lg border border-red-500 animate-pulse">
            El Terminali Modu
          </div>
          
          {terminalMode ? (
             <div className="w-full max-w-sm space-y-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                   <h3 className="text-xl font-bold">{terminalMode === 'mal_kabul' ? 'Mal Kabul (SKT/Lot)' : terminalMode === 'toplama' ? 'Sipariş Toplama' : terminalMode === 'yazdir' ? 'Kargo/Barkod Yazdır' : 'Sayım Fişi'}</h3>
                   <button onClick={() => setTerminalMode(null)} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full"><X size={20} /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Barkod Okutunuz</label>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              autoFocus
                              value={barcodeInput}
                              onChange={e => setBarcodeInput(e.target.value)}
                              onKeyDown={e => {
                                  if (e.key === 'Enter' && barcodeInput.trim()) {
                                      // Simulate scanning
                                      alert(`${barcodeInput} barkodu okundu!`);
                                      setBarcodeInput('');
                                  }
                              }}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-lg font-mono focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                              placeholder="||||||||||||||||||||"
                           />
                           <button className="bg-gray-800 border border-gray-700 p-3 rounded-xl text-emerald-400 hover:bg-gray-700"><ScanBarcode size={24} /></button>
                        </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 min-h-[200px] flex items-center justify-center text-gray-500 text-sm text-center">
                        Bekleniyor...
                    </div>
                </div>
             </div>
          ) : (
             <div className="w-full max-w-sm space-y-6">
                 <div className="text-center space-y-2 mb-8">
                   <ScanBarcode size={64} className="mx-auto text-emerald-400 mb-4" />
                   <h3 className="text-2xl font-black tracking-tight">WMS Mobil</h3>
                   <p className="text-gray-400 text-sm">Seri/Lot okutmak için barkod tarayın.</p>
                 </div>
                 
                 <button onClick={() => setTerminalMode('mal_kabul')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-2xl shadow-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
                    <ArrowRight size={24} /> Mal Kabul (SKT/Lot)
                 </button>
                 <button onClick={() => setTerminalMode('toplama')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl shadow-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
                    <Truck size={24} /> Sipariş Toplama
                 </button>
                 <button onClick={() => setTerminalMode('yazdir')} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-6 rounded-2xl shadow-xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
                    <Box size={24} /> Kargo Fişi / Barkod Yazdır
                 </button>
                 <button onClick={() => setTerminalMode('sayim')} className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-6 rounded-2xl shadow-xl border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
                    <Layers size={24} /> Sayım Fişi
                 </button>
             </div>
          )}
        </div>
      ) : null}

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
