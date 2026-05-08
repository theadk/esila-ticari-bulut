import React, { useState } from 'react';
import { Warehouse, Package, Search, Box, ArrowRight } from 'lucide-react';
import { MOCK_PRODUCTS } from '../mockData';

const WAREHOUSES = ['Ana Depo', 'Şube Depo', 'Soğuk Hava Deposu', 'İade Deposu'];

export const Depo: React.FC = () => {
  const [activeWarehouse, setActiveWarehouse] = useState<string>('Ana Depo');
  const [searchTerm, setSearchTerm] = useState('');

  // Sadece ürünlerin güncel datasını simüle etmek için state (gerçekte global state/context veya API'den gelecektir)
  const products = MOCK_PRODUCTS;

  const warehouseStats = WAREHOUSES.map(wh => {
    const whProducts = products.filter(p => p.warehouse === wh);
    const uniqueItems = whProducts.length;
    const totalStock = whProducts.reduce((sum, p) => sum + p.stock, 0);
    return { name: wh, uniqueItems, totalStock };
  });

  const filteredProducts = products.filter(p => 
    p.warehouse === activeWarehouse &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (p.barcode && p.barcode.includes(searchTerm)))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Depo Yönetimi</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouseStats.map((stat) => (
          <div 
            key={stat.name}
            onClick={() => setActiveWarehouse(stat.name)}
            className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 ${
              activeWarehouse === stat.name 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform -translate-y-1' 
                : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm text-gray-700'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${activeWarehouse === stat.name ? 'bg-emerald-500/50 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                <Warehouse size={24} />
              </div>
              {activeWarehouse === stat.name && <ArrowRight size={20} className="opacity-80" />}
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
    </div>
  );
};
