import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, Edit2, Trash2, X, Save } from 'lucide-react';
import { Product, Warehouse, Category } from '../types';
import { api } from '../lib/api';

const INITIAL_FORM: Product = {
  id: '',
  code: '',
  name: '',
  price: 0,
  stock: 0,
  category: '',
  subCategory: '',
  warehouse: '',
  barcode: '',
  description: '',
  brand: '',
  taxRate: 20,
  variants: []
};

export const Urunler: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'urunler' | 'kategoriler'>('urunler');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  
  // Kategori Formu State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<Category>({ id: '', name: '', subCategories: [] });
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Depo Hızlı Ekleme
  const [isQuickWhOpen, setIsQuickWhOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');

  const loadData = async () => {
    try {
      const [prds, whs, cats] = await Promise.all([api.getProducts(), api.getWarehouses(), api.getCategories()]);
      setProducts(prds);
      setWarehouses(whs);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };
  
  const filteredProducts = (products || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm)) ||
    (p.warehouse && p.warehouse.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddNew = () => {
    setFormData({ ...INITIAL_FORM, id: Math.random().toString(36).substr(2, 9) });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setFormData({ ...product });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        await api.deleteProduct(id);
        await loadData();
      } catch (error) {
         console.error('Failed to delete product:', error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateProduct(formData.id, formData);
      } else {
        await api.addProduct(formData);
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

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      try {
        await api.deleteCategory(id);
        await loadData();
      } catch (error) {
         console.error('Failed to delete category:', error);
      }
    }
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
        <div className="flex items-center gap-4">
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
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'urunler' ? (
            <>
              <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
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
          ) : (
            <button 
              onClick={handleAddNewCategory}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Kategori</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'urunler' ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
           <div className="relative max-w-md">
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
                <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{product.name}</div>
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
                      {product.warehouse && (
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
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
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

      {/* Ürün Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                    {categories.find(c => c.name === formData.category)?.subCategories.map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <input 
                    type="text" 
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi</label>
                  <input 
                    required
                    type="number" 
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Depo</label>
                <div className="flex gap-2">
                  <select 
                    required={!isQuickWhOpen}
                    value={formData.warehouse || ''}
                    onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Depo Seçin</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.name}>{wh.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsQuickWhOpen(true)} className="p-2 border border-gray-300 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Plus size={20} />
                  </button>
                </div>
                {isQuickWhOpen && (
                  <div className="mt-2 flex gap-2">
                    <input 
                       type="text" 
                       value={newWhName} 
                       onChange={e => setNewWhName(e.target.value)} 
                       placeholder="Yeni depo adı"
                       className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <button type="button" onClick={handleQuickWhAdd} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700">Ekle</button>
                    <button type="button" onClick={() => setIsQuickWhOpen(false)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200">İptal</button>
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
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                      {category.subCategories.length > 0 ? (
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
                          onClick={() => handleDeleteCategory(category.id)}
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">{isCategoryEditing ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
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
                    value={categoryFormData.subCategories.join(', ')}
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
      )}
    </div>
  );
};