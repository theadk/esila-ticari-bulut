import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { Product } from '../types';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, CheckCircle, AlertTriangle, X, Play, Square, FileText, Search, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

import { hasPermission } from '../lib/permissions';

interface CountedProduct {
  productId: string;
  code: string;
  barcode?: string;
  name: string;
  systemStock: number;
  countedStock: number;
}

export const StokSayim: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === sessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'stoksayim', 'view');
  
  const { products } = store;
  const [isScanning, setIsScanning] = useState(false);
  const [countedItems, setCountedItems] = useState<CountedProduct[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    processBarcode(decodedText);
    toast.success(`Barkod Okundu: ${decodedText}`);
  };

  const processBarcode = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.code === barcode);
    if (!product) {
      toast.error('Bu barkoda ait ürün bulunamadı!', { id: 'barcode-error' });
      return;
    }

    setCountedItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, countedStock: item.countedStock + 1 }
            : item
        );
      } else {
        const getProductTotalStock = (p: Product) => {
          if (p.warehouseStocks && p.warehouseStocks.length > 0) {
            return p.warehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
          }
          return Number(p.stock) || 0;
        };

        return [...prev, {
          productId: product.id,
          code: product.code,
          barcode: product.barcode,
          name: product.name,
          systemStock: getProductTotalStock(product),
          countedStock: 1
        }];
      }
    });
  };

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true
        },
        false
      );
      scannerRef.current.render(handleScanSuccess, (error) => {
        // optionally handle errors, but it gets spammy so ignore
      });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setIsScanning(false);
        scannerRef.current = null;
      }).catch(e => console.error(e));
    } else {
        setIsScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      processBarcode(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const updateCount = (productId: string, delta: number) => {
    setCountedItems(prev => prev.map(item => {
      if (item.productId === productId) {
         const newAmount = Math.max(0, item.countedStock + delta);
         return { ...item, countedStock: newAmount };
      }
      return item;
    }));
  };

  const removeCountedItem = (productId: string) => {
    setCountedItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSaveCount = () => {
    if (countedItems.length === 0) {
      toast.error('Kaydedilecek sayım bulunamadı.');
      return;
    }

    const newProducts = [...store.products];

    countedItems.forEach(item => {
      const idx = newProducts.findIndex(p => p.id === item.productId);
      if (idx > -1) {
        const product = newProducts[idx];
        const assignedWarehouse = currentUser?.assignedWarehouse;
        let newWarehouseStocks = product.warehouseStocks ? [...product.warehouseStocks] : [];

        if (assignedWarehouse) {
            const wIdx = newWarehouseStocks.findIndex(ws => ws.warehouseId === assignedWarehouse);
            if (wIdx > -1) {
                newWarehouseStocks[wIdx] = { ...newWarehouseStocks[wIdx], stock: item.countedStock };
            } else {
                newWarehouseStocks.push({ warehouseId: assignedWarehouse, stock: item.countedStock });
            }
            
            const totalStock = newWarehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
            newProducts[idx] = { ...product, stock: totalStock, warehouseStocks: newWarehouseStocks };
        } else {
            if (newWarehouseStocks.length > 0) {
                const globalWh = newWarehouseStocks.find(w => w.warehouseId === product.warehouse || w.warehouseId === 'Merkez');
                if (globalWh) {
                   globalWh.stock = item.countedStock;
                } else if (newWarehouseStocks.length === 1) {
                   newWarehouseStocks[0].stock = item.countedStock;
                }
            }
            newProducts[idx] = { ...product, stock: item.countedStock, warehouseStocks: newWarehouseStocks };
        }
      }
    });

    if(store.setProducts) store.setProducts(newProducts);
    toast.success('Stok sayımı başarıyla kaydedildi! Farklar ürünlere yansıtıldı.');
    setCountedItems([]);
  };

  const filteredItems = countedItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.barcode && item.barcode.includes(searchQuery))
  );

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <FileText size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Stok Sayım modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hızlı Stok Sayım</h1>
          <p className="text-gray-600 mt-1">Kamera ile barkod okutarak veya elle stok fark raporu oluşturun.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setCountedItems([])}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
                <X size={18} /> Sıfırla
            </button>
            <button onClick={handleSaveCount} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                <FileText size={18} /> Sayımı Kaydet
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Camera className="text-emerald-600" /> Barkod Okuyucu
            </h3>
            
            {!isScanning ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Camera size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 text-center mb-4 text-sm">Sayım yapmak için kamerayı başlatın</p>
                <button
                  onClick={startScanner}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Play size={18} /> Kamerayı Başlat
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div id="reader" className="w-full overflow-hidden rounded-lg outline-none border-none"></div>
                <button
                  onClick={stopScanner}
                  className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors w-full justify-center font-medium"
                >
                  <Square size={18} /> Durdur
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
              <form onSubmit={handleManualSubmit}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manuel Barkod/Kod Girişi</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Barkod girin ve enter'a basın..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">Sayım Özeti</h3>
            <div className="space-y-4">
               <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="text-emerald-800 text-sm font-medium">Toplam Sayılan Çeşit</div>
                  <div className="text-2xl font-bold text-emerald-900">{countedItems.length}</div>
               </div>
               <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-800 text-sm font-medium">Toplam Sayılan Ürün Adedi</div>
                  <div className="text-2xl font-bold text-blue-900">{countedItems.reduce((acc, curr) => acc + curr.countedStock, 0)}</div>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
              <h3 className="font-semibold text-lg text-gray-800">Fark Raporu ({filteredItems.length})</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 font-semibold">Ürün Adı</th>
                    <th className="p-4 font-semibold">Barkod / Kod</th>
                    <th className="p-4 font-semibold text-center">Sistem Stoku</th>
                    <th className="p-4 font-semibold text-center">Sayılan</th>
                    <th className="p-4 font-semibold text-center">Fark</th>
                    <th className="p-4 font-semibold text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map(item => {
                    const diff = item.countedStock - item.systemStock;
                    const DiffIcon = diff === 0 ? CheckCircle : AlertTriangle;
                    const diffColorClass = diff === 0 ? 'text-emerald-600 bg-emerald-50' : (diff > 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50');

                    return (
                      <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-gray-800">{item.name}</div>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="text-gray-500 font-mono">{item.barcode || '-'}</div>
                          <div className="text-gray-400 text-xs">{item.code}</div>
                        </td>
                        <td className="p-4 text-center font-medium text-gray-600">
                          {item.systemStock}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <button onClick={() => updateCount(item.productId, -1)} className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"><Minus size={14} /></button>
                             <span className="font-bold text-gray-900 w-8 text-center">{item.countedStock}</span>
                             <button onClick={() => updateCount(item.productId, 1)} className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"><Plus size={14} /></button>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm ${diffColorClass}`}>
                             {diff !== 0 && <DiffIcon size={14} />}
                             {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                           <button 
                             onClick={() => removeCountedItem(item.productId)}
                             className="text-gray-400 hover:text-red-500 transition-colors"
                           >
                              <X size={18} />
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        Henüz ürün okutulmadı veya arama sonucu bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
