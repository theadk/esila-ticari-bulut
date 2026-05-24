import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Package, Edit2, Trash2, X, Save, Upload, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, Warehouse, Category, Brand } from '../types';
import { api } from '../lib/api';
import { useAppStore } from '../lib/store';

const INITIAL_FORM: Product = {
  id: '',
  code: '',
  name: '',
  price: 0,
  purchasePrice: 0,
  stock: 0,
  category: '',
  subCategory: '',
  warehouse: '',
  warehouseStocks: [{ warehouseId: '', stock: 0 }],
  barcode: '',
  description: '',
  brand: '',
  taxRate: 20,
  variants: [],
  showInQuickSale: false
};

export const Urunler: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'urunler' | 'kategoriler' | 'markalar'>('urunler');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [filterMinStock, setFilterMinStock] = useState<number | ''>('');
  const [filterMaxStock, setFilterMaxStock] = useState<number | ''>('');
  const [filterMinPrice, setFilterMinPrice] = useState<number | ''>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Kategori Formu State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<Category>({ id: '', name: '', subCategories: [] });
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);

  // Marka Formu State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandFormData, setBrandFormData] = useState<Brand>({ id: '', name: '' });
  const [isBrandEditing, setIsBrandEditing] = useState(false);

  const [deleteData, setDeleteData] = useState<{ id: string, type: 'product' | 'category' | 'brand', name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Depo Hızlı Ekleme
  const [isQuickWhOpen, setIsQuickWhOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');

  const loadData = async () => {
    try {
      const [prds, whs, cats, brs] = await Promise.all([api.getProducts(), api.getWarehouses(), api.getCategories(), api.getBrands()]);
      setProducts(prds);
      setWarehouses(whs);
      setCategories(cats);
      setBrands(brs);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToExcel = () => {
    const exportData = filteredProducts.map(p => ({
      'Ürün Kodu': p.code,
      'Ürün Adı': p.name,
      'Kategori': p.category,
      'Alt Kategori': p.subCategory || '',
      'Marka': p.brand || '',
      'Perakende Fiyatı': p.price,
      'Stok': p.stock,
      'KDV Oranı': p.taxRate || 0,
      'Depo': p.warehouse || '',
      'Barkod': p.barcode || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ürünler");
    XLSX.writeFile(wb, "urun_listesi.xlsx");
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newProducts: Product[] = data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          code: row['Ürün Kodu']?.toString() || '',
          name: row['Ürün Adı']?.toString() || '',
          category: row['Kategori']?.toString() || 'Genel',
          subCategory: row['Alt Kategori']?.toString() || '',
          brand: row['Marka']?.toString() || '',
          price: Number(row['Perakende Fiyatı']) || Number(row['Fiyat']) || 0,
          stock: Number(row['Stok']) || 0,
          taxRate: Number(row['KDV Oranı']) || 0,
          warehouse: row['Depo']?.toString() || '',
          barcode: row['Barkod']?.toString() || ''
        })).filter((p: any) => p.name && p.code);
        
        if (newProducts.length > 0) {
          // just use setProducts and assume a simple store mechanism, but since api exists we can also use that if createBulk is available. 
          // Let's check what 'api.products.createBulk' is... Actually we have a store in this app probably or just local state saving is done with `api.addProduct`.
          for(const p of newProducts) {
             await api.addProduct(p);
          }
          setProducts([...products, ...newProducts]);
          alert(`${newProducts.length} ürün başarıyla eklendi.`);
        }
      } catch (error) {
        console.error("Error importing excel:", error);
        alert("Excel dosyası okunurken bir hata oluştu.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handlePrintBarcode = (product: Product) => {
    if (!product.barcode) {
      alert("Bu ürünün barkodu bulunmuyor. Öncelikle barkod ekleyin.");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Pop-up engelleyiciyi kapatıp tekrar deneyin.");
        return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${product.name} - Barkod</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @media print {
              @page { margin: 0; size: auto; }
              body { margin: 0; }
            }
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: #fff;
            }
            .label {
              width: 50mm;
              height: 30mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 2mm;
              box-sizing: border-box;
            }
            .product-name {
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              margin-bottom: 2px;
            }
            .price {
              font-size: 12px;
              font-weight: bold;
              margin-top: 2px;
            }
            svg {
              max-width: 100%;
              height: 15mm;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${product.name}</div>
            <svg id="barcode"></svg>
            <div class="price">${product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
          <script>
            JsBarcode("#barcode", "${product.barcode}", {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 12,
              margin: 0
            });
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredProducts = (products || []).filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.warehouse && p.warehouse.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory ? p.category === filterCategory : true;
    const matchesBrand = filterBrand ? p.brand === filterBrand : true;
    
    let matchesStockStatus = true;
    if (filterStockStatus === 'out_of_stock') matchesStockStatus = p.stock === 0;
    if (filterStockStatus === 'low_stock') matchesStockStatus = p.stock > 0 && p.stock <= 10;

    const matchesMinStock = (filterMinStock !== '') ? p.stock >= Number(filterMinStock) : true;
    const matchesMaxStock = (filterMaxStock !== '') ? p.stock <= Number(filterMaxStock) : true;
    
    const matchesMinPrice = (filterMinPrice !== '') ? p.price >= Number(filterMinPrice) : true;
    const matchesMaxPrice = (filterMaxPrice !== '') ? p.price <= Number(filterMaxPrice) : true;

    return matchesSearch && matchesCategory && matchesBrand && matchesStockStatus && matchesMinStock && matchesMaxStock && matchesMinPrice && matchesMaxPrice;
  });

  const handleAddNew = () => {
    const nextId = `${store.settings.prefix_product || 'URN'}-${store.settings.next_product_id || 1001}`;
    setFormData({ ...INITIAL_FORM, code: nextId, id: Math.random().toString(36).substr(2, 9) });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setFormData({ ...product });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteData({ id: product.id, type: 'product', name: product.name });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateProduct(formData.id, formData);
      } else {
        await api.addProduct(formData);
        store.setSettings({
          ...store.settings,
          next_product_id: (store.settings.next_product_id || 1001) + 1
        });
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleAddNewCategory = () => {
    setCategoryFormData({ id: Math.random().toString(36).substr(2, 9), name: '', subCategories: [] });
    setIsCategoryEditing(false);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryFormData({ ...category });
    setIsCategoryEditing(true);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteData({ id: category.id, type: 'category', name: category.name });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCategoryEditing) {
        await api.updateCategory(categoryFormData.id, categoryFormData);
      } else {
        await api.addCategory(categoryFormData);
      }
      await loadData();
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleAddNewBrand = () => {
    setBrandFormData({ id: Math.random().toString(36).substr(2, 9), name: '' });
    setIsBrandEditing(false);
    setIsBrandModalOpen(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setBrandFormData({ ...brand });
    setIsBrandEditing(true);
    setIsBrandModalOpen(true);
  };

  const handleDeleteBrand = (brand: Brand) => {
    setDeleteData({ id: brand.id, type: 'brand', name: brand.name });
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    try {
      if (deleteData.type === 'product') {
        await api.deleteProduct(deleteData.id);
      } else if (deleteData.type === 'category') {
        await api.deleteCategory(deleteData.id);
      } else if (deleteData.type === 'brand') {
        await api.deleteBrand(deleteData.id);
      }
      await loadData();
      setDeleteData(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isBrandEditing) {
        await api.updateBrand(brandFormData.id, brandFormData);
      } else {
        await api.addBrand(brandFormData);
      }
      await loadData();
      setIsBrandModalOpen(false);
    } catch (error) {
      console.error('Failed to save brand:', error);
    }
  };

  const handleQuickWhAdd = async () => {
    if (!newWhName) return;
    try {
      const whToSave = { id: String(Date.now()), name: newWhName, address: '', capacity: 0 };
      await api.addWarehouse(whToSave);
      setFormData({ ...formData, warehouse: newWhName });
      setIsQuickWhOpen(false);
      setNewWhName('');
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Ürün Yönetimi</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('urunler')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'urunler' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ürünler
            </button>
            <button
              onClick={() => setActiveTab('kategoriler')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'kategoriler' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Kategoriler
            </button>
            <button
              onClick={() => setActiveTab('markalar')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'markalar' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Markalar
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'urunler' ? (
            <>
              <input type="file" ref={fileInputRef} onChange={importFromExcel} className="hidden" accept=".xlsx, .xls, .csv" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">İçe Aktar</span>
              </button>
              <button 
                onClick={exportToExcel}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Dışa Aktar</span>
              </button>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`bg-white border ${isFilterOpen ? 'border-emerald-500 text-emerald-600' : 'border-gray-300 text-gray-700'} hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
              >
                 <Filter size={18} />
                 <span>Filtrele</span>
              </button>
              <button 
                onClick={handleAddNew}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>Yeni Ürün</span>
              </button>
            </>
          ) : activeTab === 'kategoriler' ? (
            <button 
              onClick={handleAddNewCategory}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Kategori</span>
            </button>
          ) : (
            <button 
              onClick={handleAddNewBrand}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Marka</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'urunler' ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="p-4 border-b border-gray-100">
           <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Ürün adı, kodu, barkodu veya depo ile ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isFilterOpen && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kategori</label>
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Tümü</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Marka</label>
              <select 
                value={filterBrand} 
                onChange={e => setFilterBrand(e.target.value)}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Tümü</option>
                {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Stok Durumu</label>
              <select 
                value={filterStockStatus} 
                onChange={e => setFilterStockStatus(e.target.value as any)}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Tümü</option>
                <option value="out_of_stock">Tükendi (Stok = 0)</option>
                <option value="low_stock">Stok Az (1-10)</option>
              </select>
            </div>
            <div>
               <label className="block text-sm text-gray-600 mb-1">Stok Miktarı</label>
               <div className="flex gap-2">
                 <input 
                   type="number" 
                   placeholder="Min" 
                   value={filterMinStock} 
                   onChange={e => setFilterMinStock(e.target.value)}
                   className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                 />
                 <input 
                   type="number" 
                   placeholder="Max" 
                   value={filterMaxStock} 
                   onChange={e => setFilterMaxStock(e.target.value)}
                   className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                 />
               </div>
            </div>
            <div>
               <label className="block text-sm text-gray-600 mb-1">Fiyat (₺)</label>
               <div className="flex gap-2">
                 <input 
                   type="number" 
                   placeholder="Min" 
                   value={filterMinPrice} 
                   onChange={e => setFilterMinPrice(e.target.value)}
                   className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                 />
                 <input 
                   type="number" 
                   placeholder="Max" 
                   value={filterMaxPrice} 
                   onChange={e => setFilterMaxPrice(e.target.value)}
                   className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                 />
               </div>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 flex items-end justify-end">
              <button 
                onClick={() => {
                  setFilterCategory('');
                  setFilterBrand('');
                  setFilterStockStatus('all');
                  setFilterMinStock('');
                  setFilterMaxStock('');
                  setFilterMinPrice('');
                  setFilterMaxPrice('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Filtreleri Temizle
              </button>
            </div>

          </div>
        )}
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">Ürün Bilgisi</th>
              <th className="px-6 py-4">Barkod</th>
              <th className="px-6 py-4">Kategori & Depo</th>
              <th className="px-6 py-4">Fiyat</th>
              <th className="px-6 py-4">Stok Durumu</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                  onClick={() => { setSelectedProduct(product); setIsDetailsOpen(true); }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          {product.name}
                          {product.showInQuickSale && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full" title="Hızlı Satışta Listeleniyor">Hızlı</span>}
                        </div>
                        <div className="text-xs text-gray-500">{product.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 text-sm font-medium">{product.barcode || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium w-fit">
                        {product.category}{product.subCategory ? ` > ${product.subCategory}` : ''}
                      </span>
                      {product.variants && product.variants.length > 0 && (
                         <span className="text-xs text-purple-600 font-medium">
                             {product.variants.join(', ')}
                         </span>
                      )}
                      {product.warehouseStocks && product.warehouseStocks.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                           {product.warehouseStocks.map((ws, i) => ws.warehouseId && (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium w-fit border border-blue-100">
                                {ws.warehouseId}: {ws.stock}
                              </span>
                           ))}
                        </div>
                      ) : product.warehouse && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium w-fit">
                          {product.warehouse}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {Number(product.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </td>
                  <td className="px-6 py-4">
                    {product.stock === 0 ? (
                      <span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">Tükendi</span>
                    ) : product.stock < 10 ? (
                      <span className="text-orange-600 text-sm font-medium bg-orange-50 px-2 py-1 rounded">Kritik ({product.stock})</span>
                    ) : (
                      <span className="text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded">Stokta ({product.stock})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePrintBarcode(product); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                          title="Barkod Yazdır"
                        >
                          <Printer size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ürün Detay Modal */}
      {isDetailsOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsDetailsOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Ürün Detayları</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                   <Package size={32} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                     {selectedProduct.name}
                     {selectedProduct.showInQuickSale && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full" title="Hızlı Satışta Listeleniyor">Hızlı</span>}
                   </h2>
                   <p className="text-gray-500">{selectedProduct.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                 <div>
                    <span className="block text-gray-500 mb-1">Barkod</span>
                    <span className="font-medium text-gray-800">{selectedProduct.barcode || '-'}</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 mb-1">Marka</span>
                    <span className="font-medium text-gray-800">{selectedProduct.brand || '-'}</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 mb-1">Kategori</span>
                    <span className="font-medium text-gray-800">{selectedProduct.category}</span>
                 </div>
                 {selectedProduct.subCategory && (
                   <div>
                      <span className="block text-gray-500 mb-1">Alt Kategori</span>
                      <span className="font-medium text-gray-800">{selectedProduct.subCategory}</span>
                   </div>
                 )}
                 {selectedProduct.warehouseStocks && selectedProduct.warehouseStocks.length > 0 ? (
                    <div className="col-span-2">
                       <span className="block text-gray-500 mb-2">Depo ve Stok Dağılımı</span>
                       <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {selectedProduct.warehouseStocks.map((ws, i) => ws.warehouseId && (
                             <div key={i} className="flex justify-between items-center text-sm">
                               <span className="font-medium text-gray-700 font-medium">{ws.warehouseId}</span>
                               <span className="bg-white px-2 py-1 rounded text-gray-800 font-semibold shadow-sm text-xs">{ws.stock} Adet</span>
                             </div>
                          ))}
                          <div className="flex justify-between items-center text-sm pt-2 mt-1 border-t border-gray-200">
                               <span className="font-bold text-gray-800">Toplam Stok</span>
                               <span className="text-emerald-600 font-bold px-2">{selectedProduct.stock} Adet</span>
                          </div>
                       </div>
                    </div>
                 ) : (
                   <>
                     <div>
                        <span className="block text-gray-500 mb-1">Depo</span>
                        <span className="font-medium text-gray-800">{selectedProduct.warehouse || '-'}</span>
                     </div>
                     <div>
                        <span className="block text-gray-500 mb-1">Stok Miktarı</span>
                        <span className="font-medium text-gray-800">{selectedProduct.stock}</span>
                     </div>
                   </>
                 )}
                 <div>
                    <span className="block text-gray-500 mb-1">Birimi</span>
                    <span className="font-medium text-gray-800">{selectedProduct.unit || 'Adet'}</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 mb-1">Satış Fiyatı</span>
                    <span className="font-bold text-emerald-600 text-lg">{Number(selectedProduct.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                 </div>
                 {selectedProduct.taxRate && (
                   <div>
                      <span className="block text-gray-500 mb-1">KDV Oranı</span>
                      <span className="font-medium text-gray-800">%{selectedProduct.taxRate}</span>
                   </div>
                 )}
              </div>
              
              {selectedProduct.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="block text-gray-500 mb-1 text-sm">Açıklama</span>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{selectedProduct.description}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
               <button 
                 onClick={(e) => { setIsDetailsOpen(false); handleEdit(selectedProduct); }}
                 className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium flex items-center gap-2"
               >
                 <Edit2 size={18} />
                 Düzenle
               </button>
               <button 
                 onClick={() => setIsDetailsOpen(false)}
                 className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
               >
                 Kapat
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Ürün Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Kodu</label>
                  <input 
                    required
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barkod</label>
                  <input 
                    type="text" 
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value, subCategory: ''})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Kategori</label>
                  <select
                    value={formData.subCategory || ''}
                    onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                    disabled={!formData.category}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-100"
                  >
                    <option value="">Alt Kategori Seçin</option>
                    {(categories.find(c => c.name === formData.category)?.subCategories || []).map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Varyasyonlar (Virgülle ayırın)</label>
                  <input 
                    type="text" 
                    value={formData.variants?.join(', ') || ''}
                    onChange={(e) => setFormData({...formData, variants: e.target.value.split(',').map(v => v.trim()).filter(v => v)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Örn: S, M, L, XL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
                  <select 
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Marka Seçin</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Açıklama</label>
                <textarea 
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alış Fiyatı (₺)</label>
                  <input 
                    type="number" 
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satış Fiyatı (₺)</label>
                  <input 
                    required
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
                  <select 
                    value={formData.taxRate || 20}
                    onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value={1}>%1</option>
                    <option value={10}>%10</option>
                    <option value={20}>%20</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 mt-7">
                  <input
                    type="checkbox"
                    id="showInQuickSale"
                    checked={formData.showInQuickSale || false}
                    onChange={(e) => setFormData({...formData, showInQuickSale: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <label htmlFor="showInQuickSale" className="text-sm font-medium text-gray-700">
                    Hızlı Satışta Göster
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Depo ve Stok Dağılımı</label>
                  <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">Toplam Stok: {formData.stock}</span>
                </div>
                {(formData.warehouseStocks || []).map((ws, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select 
                      required
                      value={ws.warehouseId}
                      onChange={(e) => {
                         const newStocks = [...(formData.warehouseStocks || [])];
                         newStocks[i].warehouseId = e.target.value;
                         setFormData({...formData, warehouseStocks: newStocks, warehouse: newStocks[0]?.warehouseId});
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">Depo Seçin</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.name}>{wh.name}</option>
                      ))}
                    </select>
                    <input 
                      required
                      type="number" 
                      placeholder="Adet"
                      value={ws.stock === 0 ? '' : ws.stock}
                      onChange={(e) => {
                         const newStocks = [...(formData.warehouseStocks || [])];
                         newStocks[i].stock = Number(e.target.value);
                         const totalStock = newStocks.reduce((sum, s) => sum + s.stock, 0);
                         setFormData({...formData, warehouseStocks: newStocks, stock: totalStock});
                      }}
                      className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button type="button" onClick={() => {
                         const newStocks = [...(formData.warehouseStocks || [])];
                         newStocks.splice(i, 1);
                         const totalStock = newStocks.reduce((sum, s) => sum + s.stock, 0);
                         setFormData({...formData, warehouseStocks: newStocks, stock: totalStock});
                    }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200">
                      <X size={20} />
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-4 mt-2">
                  <button type="button" onClick={() => {
                    setFormData({...formData, warehouseStocks: [...(formData.warehouseStocks || []), { warehouseId: '', stock: 0 }]});
                   }} className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700">
                    <Plus size={16} /> Başka Depo Ekle
                  </button>
                  <button type="button" onClick={() => setIsQuickWhOpen(true)} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
                    <Plus size={16} /> Yeni Depo Tanımla
                  </button>
                </div>
                
                {isQuickWhOpen && (
                  <div className="mt-3 flex gap-2">
                    <input 
                       type="text" 
                       value={newWhName} 
                       onChange={e => setNewWhName(e.target.value)} 
                       placeholder="Yeni depo adı"
                       className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button type="button" onClick={handleQuickWhAdd} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700 transition-colors">Ekle</button>
                    <button type="button" onClick={() => setIsQuickWhOpen(false)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition-colors">İptal</button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      ) : activeTab === 'kategoriler' ? (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">Kategori Adı</th>
              <th className="px-6 py-4">Alt Kategoriler</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Kategori bulunamadı.
                  </td>
                </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {category.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {category.subCategories && category.subCategories.length > 0 ? (
                        category.subCategories.map(sc => (
                          <span key={sc} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                            {sc}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Kategori Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">{isCategoryEditing ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveCategory} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
                  <input 
                    required
                    type="text" 
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Örn: Elektronik"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Kategoriler (Virgülle ayırın)</label>
                  <input 
                    type="text" 
                    value={(categoryFormData.subCategories || []).join(', ')}
                    onChange={(e) => setCategoryFormData({...categoryFormData, subCategories: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Örn: Telefon, Bilgisayar, Aksesuar"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
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
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">Marka Adı</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {brands.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    Marka bulunamadı.
                  </td>
                </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {brand.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditBrand(brand)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBrand(brand)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Marka Modal */}
        {isBrandModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">{isBrandEditing ? 'Marka Düzenle' : 'Yeni Marka Ekle'}</h3>
                <button onClick={() => setIsBrandModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveBrand} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marka Adı</label>
                  <input 
                    required
                    type="text" 
                    value={brandFormData.name}
                    onChange={(e) => setBrandFormData({...brandFormData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Örn: Sony"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsBrandModalOpen(false)} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
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
      )}
      {/* Delete Confirmation Modal */}
      {deleteData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Silme İşlemini Onayla</h3>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">{deleteData.name}</span> adlı {deleteData.type === 'product' ? 'ürünü' : deleteData.type === 'category' ? 'kategoriyi' : 'markayı'} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setDeleteData(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 size={18} />
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};