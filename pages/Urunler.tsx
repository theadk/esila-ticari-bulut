import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Package, Edit2, Trash2, X, Save, Upload, Download, Printer, TrendingUp, Mic, MicOff, Camera, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, Warehouse, Category, Brand } from '../types';
import { api } from '../lib/api';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';
import { Pagination } from '../components/Pagination';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';

const INITIAL_FORM: Product = {
  id: '',
  code: '',
  name: '',
  price: 0,
  purchasePrice: 0,
  stock: 0,
  unit: 'Adet',
  category: '',
  subCategory: '',
  warehouse: '',
  warehouseStocks: [{ warehouseId: '', stock: 0 }],
  barcode: '',
  description: '',
  brand: '',
  taxRate: 20,
  variants: [],
  showInQuickSale: false,
  currency: 'TRY'
};

export const Urunler: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'urunler', 'view');
  const canCreate = hasPermission(currentUser, 'urunler', 'create');
  const canEdit = hasPermission(currentUser, 'urunler', 'edit');
  const canDelete = hasPermission(currentUser, 'urunler', 'delete');

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScannerTarget, setActiveScannerTarget] = useState<'search' | 'form'>('search');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const [exchangeRatesList, setExchangeRatesList] = useState<{Kod: string, Rate: number}[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);

  const fetchExchangeRates = async () => {
    try {
      setRatesLoading(true);
      const res = await fetch('/api/exchange-rates');
      if (!res.ok) throw new Error('Kurlar alınamadı');
      const xmlData = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      const currencies = Array.from(xmlDoc.getElementsByTagName("Currency"));
      
      const rates = currencies.map(c => {
        const kod = c.getAttribute("Kod") || '';
        const forexSelling = c.getElementsByTagName("ForexSelling")[0]?.textContent;
        return { Kod: kod, Rate: parseFloat(forexSelling || '0') };
      }).filter(c => c.Rate > 0 && ['USD', 'EUR', 'GBP'].includes(c.Kod));
      
      setExchangeRatesList(rates);
    } catch (e: any) {
      console.error('Kur bilgisi alınamadı: ' + e.message);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBarcodePrintModalOpen, setIsBarcodePrintModalOpen] = useState(false);
  const [barcodePrintOptions, setBarcodePrintOptions] = useState<{product: Product, count: number}[]>([]);
  
  // Kategori Formu State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<Category>({ id: '', name: '', subCategories: [] });
  const [newSubCategory, setNewSubCategory] = useState('');
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);

  const { isListening, supported, listen, stop } = useSpeechRecognition();
  const [activeSpeechField, setActiveSpeechField] = useState<string | null>(null);

  const startListening = (field: string, updateFn: (text: string) => void) => {
    if (isListening && activeSpeechField === field) {
      stop();
      setActiveSpeechField(null);
    } else {
      if (isListening) stop();
      setActiveSpeechField(field);
      listen((text) => {
        updateFn(text);
      });
    }
  };

  // Marka Formu State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandFormData, setBrandFormData] = useState<Brand>({ id: '', name: '' });
  const [isBrandEditing, setIsBrandEditing] = useState(false);

  const [deleteData, setDeleteData] = useState<{ id: string, type: 'product' | 'category' | 'brand', name: string } | null>(null);

  // Fiyat Revizyon State
  const [isPriceRevisionModalOpen, setIsPriceRevisionModalOpen] = useState(false);
  const [revisionForm, setRevisionForm] = useState({ category: 'all', brand: 'all', percentage: 10, type: 'increase', target: 'price' });
  const [isRevisionLoading, setIsRevisionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Depo Hızlı Ekleme
  const [isQuickWhOpen, setIsQuickWhOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');

  // Hızlı Stok Düzenleme State
  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false);
  const [quickStockQuery, setQuickStockQuery] = useState('');
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockWarehouse, setQuickStockWarehouse] = useState<string>('');
  const [quickStockQuantity, setQuickStockQuantity] = useState<number | ''>('');

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
      'Alış Fiyatı': p.purchasePrice || 0,
      'Satış Fiyatı': p.price,
      'KDV Oranı': p.taxRate || 0,
      'Stok': p.stock,
      'Birim': p.unit || 'Adet',
      'Depo': p.warehouse || '',
      'Barkod': p.barcode || '',
      'Varyantlar': (p.variants || []).join(', '),
      'Kısa Açıklama': p.description || '',
      'Hızlı Satışta Göster': p.showInQuickSale ? 'Evet' : 'Hayır'
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
        
        const importedData = data.map((row: any) => ({
          code: row['Ürün Kodu']?.toString() || '',
          name: row['Ürün Adı']?.toString() || '',
          category: row['Kategori']?.toString() || 'Genel',
          subCategory: row['Alt Kategori']?.toString() || '',
          brand: row['Marka']?.toString() || '',
          purchasePrice: Number(row['Alış Fiyatı']) || 0,
          price: Number(row['Satış Fiyatı']) || Number(row['Perakende Fiyatı']) || Number(row['Fiyat']) || 0,
          taxRate: (row['KDV Oranı'] !== undefined && row['KDV Oranı'] !== null) ? Number(row['KDV Oranı']) : 20,
          stock: Number(row['Stok']) || 0,
          unit: row['Birim']?.toString() || 'Adet',
          warehouse: row['Depo']?.toString() || '',
          barcode: row['Barkod']?.toString() || '',
          variants: row['Varyantlar'] ? row['Varyantlar'].toString().split(',').map((v: string) => v.trim()).filter(Boolean) : [],
          description: row['Kısa Açıklama']?.toString() || '',
          showInQuickSale: row['Hızlı Satışta Göster']?.toString().toLowerCase() === 'evet' || row['Hızlı Satışta Göster']?.toString().toLowerCase() === 'true'
        })).filter((p: any) => p.name && p.code);
        
        if (importedData.length > 0) {
          let updatedCount = 0;
          let addedCount = 0;
          const currentProducts = [...products];

          for(const impProduct of importedData) {
             const existingIndex = currentProducts.findIndex((p: Product) => 
                 p.code === impProduct.code || (p.barcode && impProduct.barcode && p.barcode === impProduct.barcode)
             );
             
             if (existingIndex >= 0) {
                 const existingProduct = currentProducts[existingIndex];
                 const updatedProduct = {
                     ...existingProduct,
                     ...impProduct,
                     id: existingProduct.id, 
                     warehouseStocks: [{ warehouseId: impProduct.warehouse || existingProduct.warehouse || '', stock: impProduct.stock }]
                 };
                 await api.updateProduct(existingProduct.id, updatedProduct);
                 currentProducts[existingIndex] = updatedProduct;
                 updatedCount++;
             } else {
                 const newProduct = {
                     ...impProduct,
                     warehouseStocks: [{ warehouseId: impProduct.warehouse || '', stock: impProduct.stock }],
                     id: Math.random().toString(36).substr(2, 9)
                 };
                 await api.addProduct(newProduct);
                 currentProducts.push(newProduct);
                 addedCount++;
             }
          }
          setProducts(currentProducts);
          alert(`${addedCount} ürün eklendi, ${updatedCount} ürün güncellendi.`);
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

    const isQR = store.settings?.barcode_type === 'QR';
    
    const htmlContent = `
      <html>
        <head>
          <title>${product.name} - Barkod</title>
          ${isQR ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>' : '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>'}
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
            .product-code {
              font-size: 8px;
              color: #555;
              margin-bottom: 2px;
            }
            .price {
              font-size: 12px;
              font-weight: bold;
              margin-top: 2px;
            }
            .barcode-container {
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 2px 0;
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
            <div class="product-code">Stok: ${product.code}</div>
            <div class="barcode-container">
              ${isQR ? '<div id="barcode"></div>' : '<svg id="barcode"></svg>'}
            </div>
            ${isQR ? `<div class="product-code mt-1">${product.barcode}</div>` : ''}
            <div class="price">${Number(product.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
          <script>
            try {
              ${isQR ? `
                new QRCode(document.getElementById("barcode"), {
                  text: "${product.barcode}",
                  width: 50,
                  height: 50,
                  colorDark : "#000000",
                  colorLight : "#ffffff",
                  correctLevel : QRCode.CorrectLevel.L
                });
              ` : `
                JsBarcode("#barcode", "${product.barcode}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 40,
                  displayValue: true,
                  fontSize: 12,
                  margin: 0
                });
              `}
            } catch(e) { console.error(e); }
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

  const handleBulkPrintBarcode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Pop-up engelleyiciyi kapatıp tekrar deneyin.");
        return;
    }

    const isQR = store.settings?.barcode_type === 'QR';

    const labelsHtml = barcodePrintOptions.flatMap(opt => {
      // Repeat the label 'count' times
      return Array.from({ length: opt.count }).map((_, idx) => `
        <div class="label" style="page-break-after: always;">
          <div class="product-name">${opt.product.name}</div>
          <div class="product-code">Stok: ${opt.product.code}</div>
          <div class="barcode-container">
            ${isQR ? `<div id="barcode-${opt.product.id}-${idx}"></div>` : `<svg id="barcode-${opt.product.id}-${idx}"></svg>`}
          </div>
          ${isQR ? `<div class="product-code mt-1">${opt.product.barcode || '0000000'}</div>` : ''}
          <div class="price">${Number(opt.product.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
        </div>
      `);
    }).join('');

    const scriptHtml = barcodePrintOptions.flatMap(opt => {
      return Array.from({ length: opt.count }).map((_, idx) => `
        try {
          ${isQR ? `
            new QRCode(document.getElementById("barcode-${opt.product.id}-${idx}"), {
              text: "${opt.product.barcode || '0000000'}",
              width: 45,
              height: 45,
              colorDark : "#000000",
              colorLight : "#ffffff",
              correctLevel : QRCode.CorrectLevel.L
            });
          ` : `
            JsBarcode("#barcode-${opt.product.id}-${idx}", "${opt.product.barcode || '0000000'}", {
              format: "CODE128",
              width: 1.5,
              height: 35,
              displayValue: true,
              fontSize: 12,
              margin: 0
            });
          `}
        } catch(e) { console.error(e); }
      `);
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Toplu Barkod Yazdır</title>
          ${isQR ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>' : '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>'}
          <style>
            @media print {
              @page { margin: 0; size: 50mm 30mm; }
              body { margin: 0; padding: 0; }
              .label { page-break-after: always; }
              .label:last-child { page-break-after: auto; }
            }
            body { 
              font-family: Arial, sans-serif; 
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
              margin: 0 auto;
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
            .product-code {
              font-size: 8px;
              color: #555;
              margin-bottom: 2px;
            }
            .price {
              font-size: 11px;
              font-weight: bold;
              margin-top: 2px;
            }
            .barcode-container {
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 2px 0;
            }
            svg {
              max-width: 100%;
              height: 12mm;
            }
          </style>
        </head>
        <body>
          ${labelsHtml || '<div style="padding: 20px;">Geçerli barkod bulunamadı. Lütfen ürünlere barkod ekleyin.</div>'}
          <script>
            ${scriptHtml}
            setTimeout(() => {
              window.print();
              // window.close();
            }, 800);
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsBarcodePrintModalOpen(false);
  };

  const getProductTotalStock = (p: Product) => {
    if (p.warehouseStocks && p.warehouseStocks.length > 0) {
      return p.warehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
    }
    return Number(p.stock) || 0;
  };

  const filteredProducts = (products || []).filter(p => {
    if (currentUser?.assignedWarehouse) {
      const assigned = warehouses.find(w => w.id === currentUser.assignedWarehouse)?.name || currentUser.assignedWarehouse;
      const hasStockInAssigned = p.warehouseStocks?.some(ws => ws.warehouseId === assigned);
      if (!hasStockInAssigned && p.warehouse !== assigned) {
        return false;
      }
    }

    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.warehouse && p.warehouse.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory ? p.category === filterCategory : true;
    const matchesBrand = filterBrand ? p.brand === filterBrand : true;
    
    const totalStock = getProductTotalStock(p);
    
    let matchesStockStatus = true;
    if (filterStockStatus === 'out_of_stock') matchesStockStatus = totalStock <= 0;
    if (filterStockStatus === 'low_stock') matchesStockStatus = totalStock > 0 && totalStock <= 10;

    const matchesMinStock = (filterMinStock !== '') ? totalStock >= Number(filterMinStock) : true;
    const matchesMaxStock = (filterMaxStock !== '') ? totalStock <= Number(filterMaxStock) : true;
    
    const matchesMinPrice = (filterMinPrice !== '') ? p.price >= Number(filterMinPrice) : true;
    const matchesMaxPrice = (filterMaxPrice !== '') ? p.price <= Number(filterMaxPrice) : true;

    return matchesSearch && matchesCategory && matchesBrand && matchesStockStatus && matchesMinStock && matchesMaxStock && matchesMinPrice && matchesMaxPrice;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = itemsPerPage === -1 ? filteredProducts : filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterBrand, filterStockStatus, filterMinStock, filterMaxStock, filterMinPrice, filterMaxPrice]);

  const handleAddNew = () => {
    const nextId = `${store.settings.prefix_product || 'URN'}-${store.settings.next_product_id || 1001}`;
    setFormData({ ...INITIAL_FORM, code: nextId, id: Math.random().toString(36).substr(2, 9), warehouseStocks: [{ warehouseId: '', stock: 0 }] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setFormData({ ...product, warehouseStocks: product.warehouseStocks?.length ? product.warehouseStocks : [{ warehouseId: product.warehouse || '', stock: product.stock || 0 }] });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteData({ id: product.id, type: 'product', name: product.name });
  };

  const handleQuickStockSearch = (query: string) => {
    setQuickStockQuery(query);
    if (!query) {
      setQuickStockProduct(null);
      return;
    }
    const q = query.toLowerCase();
    const found = products.find(p => p.barcode === query || p.code.toLowerCase() === q || p.name.toLowerCase() === q);
    if (found) {
      setQuickStockProduct(found);
      setQuickStockWarehouse(found.warehouse || warehouses[0]?.id || '');
      setQuickStockQuantity('');
    } else {
      setQuickStockProduct(null);
    }
  };

  const handleQuickStockSave = async () => {
    if (!quickStockProduct || quickStockQuantity === '' || !quickStockWarehouse) return;
    
    try {
      const updatedProduct = { ...quickStockProduct };
      let newStock = Number(quickStockQuantity);
      
      // Update warehouse stock or general stock
      if (quickStockWarehouse === updatedProduct.warehouse) {
         updatedProduct.stock = newStock;
      } else {
         const whs = updatedProduct.warehouseStocks || [];
         const whIdx = whs.findIndex(w => w.warehouseId === quickStockWarehouse);
         if (whIdx >= 0) {
            whs[whIdx].stock = newStock;
         } else {
            whs.push({ warehouseId: quickStockWarehouse, stock: newStock });
         }
         updatedProduct.warehouseStocks = whs;
      }
      
      await api.updateProduct(updatedProduct.id, updatedProduct);
      
      const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      setProducts(newProducts);
      if (store.setProducts) store.setProducts(newProducts);
      
      setQuickStockQuery('');
      setQuickStockProduct(null);
      setQuickStockQuantity('');
      // setIsQuickStockModalOpen(false); // keep open for rapid entry
    } catch (e) {
      console.error(e);
      alert('Stok güncellenirken hata oluştu.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };
      if (dataToSave.warehouseStocks) {
        dataToSave.warehouseStocks = dataToSave.warehouseStocks.filter(ws => ws.warehouseId && ws.warehouseId.trim() !== '');
      }

      if (isEditing) {
        await api.updateProduct(dataToSave.id, dataToSave);
      } else {
        await api.addProduct(dataToSave);
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
    setNewSubCategory('');
    setIsCategoryEditing(false);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryFormData({ ...category });
    setNewSubCategory('');
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
      const newStocks = [...(formData.warehouseStocks || [])];
      if (newStocks.length > 0 && !newStocks[0].warehouseId) {
        newStocks[0].warehouseId = newWhName;
      } else {
        newStocks.push({ warehouseId: newWhName, stock: 0 });
      }
      setFormData({ ...formData, warehouse: newWhName, warehouseStocks: newStocks });
      setIsQuickWhOpen(false);
      setNewWhName('');
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPriceRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionForm.percentage || Number(revisionForm.percentage) <= 0) {
      alert("Geçerli bir yüzde giriniz.");
      return;
    }
    
    if (!window.confirm("Seçili kriterlere uyan ürünlerin fiyatları otomatik olarak güncellenecektir. Onaylıyor musunuz?")) {
      return;
    }

    setIsRevisionLoading(true);
    try {
      let targetProducts = products;
      if (currentUser?.assignedWarehouse) {
        const assigned = warehouses.find(w => w.id === currentUser.assignedWarehouse)?.name || currentUser.assignedWarehouse;
        targetProducts = targetProducts.filter(p => p.warehouseStocks?.some(ws => ws.warehouseId === assigned) || p.warehouse === assigned);
      }
      if (revisionForm.category !== 'all') {
         targetProducts = targetProducts.filter(p => p.category === revisionForm.category);
      }
      if (revisionForm.brand !== 'all') {
         targetProducts = targetProducts.filter(p => p.brand === revisionForm.brand);
      }

      if (targetProducts.length === 0) {
         alert("Seçilen kriterlere uyan ürün bulunamadı.");
         setIsRevisionLoading(false);
         return;
      }

      const multiplier = revisionForm.type === 'increase' 
          ? 1 + (Number(revisionForm.percentage) / 100) 
          : 1 - (Number(revisionForm.percentage) / 100);

      const promises = targetProducts.map(p => {
         const currentVal = Number(p[revisionForm.target as keyof Product] || 0);
         const newVal = currentVal * multiplier;
         return api.updateProduct(p.id, { ...p, [revisionForm.target]: parseFloat(newVal.toFixed(2)) });
      });

      await Promise.all(promises);
      await loadData();
      setIsPriceRevisionModalOpen(false);
      alert(`${targetProducts.length} adet ürünün fiyatı başarıyla güncellendi.`);
    } catch (err) {
      console.error(err);
      alert("Fiyat revizyonu sırasında bir hata oluştu.");
    } finally {
      setIsRevisionLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Package size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Ürünler modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

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
              {selectedProductIds.length > 0 && (
                <button 
                  onClick={() => {
                    const options = selectedProductIds.map(id => {
                      const p = products.find(prod => prod.id === id);
                      return p ? { product: p, count: 1 } : null;
                    }).filter(Boolean) as {product: Product, count: number}[];
                    setBarcodePrintOptions(options);
                    setIsBarcodePrintModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Printer size={18} />
                  <span>Seçilenleri Yazdır ({selectedProductIds.length})</span>
                </button>
              )}
              <button 
                onClick={() => setIsPriceRevisionModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <TrendingUp size={18} />
                <span className="hidden lg:inline">Fiyat Revizyon</span>
              </button>
              {canEdit && (
                <button 
                  onClick={() => setIsQuickStockModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Package size={18} />
                  <span className="hidden lg:inline">Hızlı Stok</span>
                </button>
              )}
              {canCreate && (
                <button 
                  onClick={handleAddNew}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  <span>Yeni Ürün</span>
                </button>
              )}
            </>
          ) : activeTab === 'kategoriler' ? (
            canCreate && (
              <button 
                onClick={handleAddNewCategory}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>Yeni Kategori</span>
              </button>
            )
          ) : (
            canCreate && (
              <button 
                onClick={handleAddNewBrand}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>Yeni Marka</span>
              </button>
            )
          )}
        </div>
      </div>

      {activeTab === 'urunler' ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="p-4 border-b border-gray-100">
           <div className="relative max-w-full sm:max-w-md flex gap-2 items-center">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
               <input 
                 type="text" 
                 placeholder="Ürün adı, kodu, barkodu veya depo ile ara..." 
                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <button 
               onClick={() => { setActiveScannerTarget('search'); setIsScannerOpen(true); }}
               className="p-2 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
               title="Barkod Okutarak Ara"
             >
               <Camera size={20} />
             </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newIds = new Set([...selectedProductIds, ...paginatedProducts.map(p => p.id)]);
                      setSelectedProductIds(Array.from(newIds));
                    } else {
                      const pIds = paginatedProducts.map(p => p.id);
                      setSelectedProductIds(selectedProductIds.filter(id => !pIds.includes(id)));
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4">Ürün Bilgisi</th>
              <th className="px-6 py-4">Barkod</th>
              <th className="px-6 py-4">Kategori & Depo</th>
              <th className="px-6 py-4">Fiyat</th>
              <th className="px-6 py-4">Stok Durumu</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                  onClick={() => { setSelectedProduct(product); setIsDetailsOpen(true); }}
                >
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedProductIds.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedProductIds([...selectedProductIds, product.id]);
                        else setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
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
                      {(() => {
                         const validStocks = (product.warehouseStocks || []).filter(ws => ws.warehouseId && warehouses.some(w => w.name === ws.warehouseId || w.id === ws.warehouseId));
                         if (validStocks.length > 0) {
                           return (
                             <div className="flex flex-wrap gap-1 mt-1">
                                {validStocks.map((ws, i) => (
                                   <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium w-fit border border-blue-100">
                                     {ws.warehouseId}: {ws.stock}
                                   </span>
                                ))}
                             </div>
                           );
                         } else if (product.warehouse && warehouses.some(w => w.name === product.warehouse || w.id === product.warehouse)) {
                           return (
                             <span className="px-3 py-1 mt-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium w-fit">
                               {product.warehouse}
                             </span>
                           );
                         }
                         return null;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {Number(product.price).toLocaleString('tr-TR', { style: 'currency', currency: product.currency || 'TRY' })}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const totalStock = getProductTotalStock(product);
                      return totalStock <= 0 ? (
                        <span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">Tükendi</span>
                      ) : totalStock < 10 ? (
                        <span className="text-orange-600 text-sm font-medium bg-orange-50 px-2 py-1 rounded">Kritik ({totalStock} {product.unit || 'Adet'})</span>
                      ) : (
                        <span className="text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded">Stokta ({totalStock} {product.unit || 'Adet'})</span>
                      );
                    })()}
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
                        {canEdit && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {activeTab === 'urunler' && (
         <Pagination 
           currentPage={currentPage}
           totalPages={totalPages}
           onPageChange={setCurrentPage}
           itemsPerPage={itemsPerPage}
           onItemsPerPageChange={setItemsPerPage}
           totalItems={filteredProducts.length}
         />
      )}

      {/* Ürün Detay Modal */}
      {isDetailsOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsDetailsOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-lg flex flex-col max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800">Ürün Detayları</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
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
                 {(() => {
                    const validStocks = (selectedProduct.warehouseStocks || []).filter(ws => ws.warehouseId && warehouses.some(w => w.name === ws.warehouseId || w.id === ws.warehouseId));
                    if (validStocks.length > 0) {
                       return (
                          <div className="col-span-2">
                             <span className="block text-gray-500 mb-2">Depo ve Stok Dağılımı</span>
                             <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                {validStocks.map((ws, i) => (
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
                       );
                    } else {
                       const validWarehouse = selectedProduct.warehouse && warehouses.some(w => w.name === selectedProduct.warehouse || w.id === selectedProduct.warehouse) ? selectedProduct.warehouse : '-';
                       return (
                          <>
                            <div>
                               <span className="block text-gray-500 mb-1">Depo</span>
                               <span className="font-medium text-gray-800">{validWarehouse}</span>
                            </div>
                            <div>
                               <span className="block text-gray-500 mb-1">Stok Miktarı</span>
                               <span className="font-medium text-gray-800">{selectedProduct.stock}</span>
                            </div>
                          </>
                       );
                    }
                 })()}
                 <div>
                    <span className="block text-gray-500 mb-1">Birimi</span>
                    <span className="font-medium text-gray-800">{selectedProduct.unit || 'Adet'}</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 mb-1">Satış Fiyatı</span>
                    <span className="font-bold text-emerald-600 text-lg">{Number(selectedProduct.price).toLocaleString('tr-TR', { style: 'currency', currency: selectedProduct.currency || 'TRY' })}</span>
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

      {/* Hızlı Stok Düzenleme Modal */}
      {isQuickStockModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800">Hızlı Stok Girişi</h3>
              <button type="button" onClick={() => setIsQuickStockModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Barkodu veya Adı</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                     <Search size={18} />
                   </div>
                   <input
                     autoFocus
                     type="text"
                     value={quickStockQuery}
                     onChange={(e) => handleQuickStockSearch(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 shadow-sm text-lg"
                     placeholder="Barkod okutun veya isim yazın..."
                   />
                </div>
              </div>
              
              {quickStockProduct && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                   <div className="font-bold text-gray-800 mb-1 text-lg">{quickStockProduct.name}</div>
                   <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                      <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{quickStockProduct.code}</span>
                      <span>Mevcut Stok: <strong className="text-gray-800">{quickStockProduct.stock} {quickStockProduct.unit}</strong></span>
                   </div>
                   
                   <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Yapılacak Depo</label>
                        <select 
                           value={quickStockWarehouse}
                           onChange={e => setQuickStockWarehouse(e.target.value)}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        >
                           <option value="">Merkez / Tanımsız Depo</option>
                           {warehouses.map(w => (
                             <option key={w.id} value={w.id}>{w.name}</option>
                           ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Stok Miktarı</label>
                        <input
                           type="number"
                           value={quickStockQuantity}
                           onChange={(e) => setQuickStockQuantity(e.target.value ? Number(e.target.value) : '')}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickStockSave();
                           }}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-bold text-xl text-center"
                           placeholder="Miktar"
                        />
                      </div>
                   </div>
                   
                   <button 
                     onClick={handleQuickStockSave}
                     disabled={quickStockQuantity === ''}
                     className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                       quickStockQuantity !== '' 
                         ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                         : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                     }`}
                   >
                     <CheckCircle size={20} />
                     Kaydet
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ürün Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-lg flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800">{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button 
                      type="button"
                      onClick={() => { setActiveScannerTarget('form'); setIsScannerOpen(true); }}
                      className="px-3 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center shrink-0"
                      title="Kamera ile Barkod Oku"
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
                  <select
                    value={formData.unit || 'Adet'}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="Adet">Adet</option>
                    <option value="Paket">Paket</option>
                    <option value="Koli">Koli</option>
                    <option value="Kutu">Kutu</option>
                    <option value="Kilo">Kilogram (kg)</option>
                    <option value="Gram">Gram (g)</option>
                    <option value="Litre">Litre (L)</option>
                    <option value="Metre">Metre (m)</option>
                    <option value="Saat">Saat</option>
                    <option value="Gün">Gün</option>
                  </select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Kısa Açıklama</label>
                  {supported && (
                    <button
                      type="button"
                      onClick={() => startListening('urunDescription', (text) => setFormData(prev => ({ ...prev, description: prev.description ? `${prev.description} ${text}` : text })))}
                      className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                        isListening && activeSpeechField === 'urunDescription' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isListening && activeSpeechField === 'urunDescription' ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                    >
                      {isListening && activeSpeechField === 'urunDescription' ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  )}
                </div>
                <textarea 
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                  <select
                    value={formData.currency || 'TRY'}
                    onChange={(e) => {
                      const newCurrency = e.target.value;
                      const oldCurrency = formData.currency || 'TRY';
                      let newPrice = formData.price;
                      let newPurchasePrice = formData.purchasePrice || 0;
                      
                      // Convert from TRY to foreign currency
                      if (oldCurrency === 'TRY' && newCurrency !== 'TRY') {
                        const rateObj = exchangeRatesList.find(r => r.Kod === newCurrency);
                        if (rateObj && rateObj.Rate > 0) {
                          newPrice = Number((formData.price / rateObj.Rate).toFixed(2));
                          newPurchasePrice = Number((newPurchasePrice / rateObj.Rate).toFixed(2));
                        }
                      } 
                      // Convert from foreign currency to TRY
                      else if (oldCurrency !== 'TRY' && newCurrency === 'TRY') {
                        const rateObj = exchangeRatesList.find(r => r.Kod === oldCurrency);
                        if (rateObj && rateObj.Rate > 0) {
                          newPrice = Number((formData.price * rateObj.Rate).toFixed(2));
                          newPurchasePrice = Number((newPurchasePrice * rateObj.Rate).toFixed(2));
                        }
                      }
                      
                      setFormData({
                        ...formData, 
                        currency: newCurrency,
                        price: newPrice,
                        purchasePrice: newPurchasePrice
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alış Fiyatı</label>
                  <input 
                    type="number" 
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satış Fiyatı</label>
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
                <div className="flex flex-col space-y-2 mt-7">
                  <div className="flex items-center space-x-2">
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasSerialTracking"
                      checked={formData.hasSerialTracking || false}
                      onChange={(e) => setFormData({...formData, hasSerialTracking: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <label htmlFor="hasSerialTracking" className="text-sm font-medium text-gray-700">
                      Seri No Takibi
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasLotTracking"
                      checked={formData.hasLotTracking || false}
                      onChange={(e) => setFormData({...formData, hasLotTracking: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <label htmlFor="hasLotTracking" className="text-sm font-medium text-gray-700">
                      Lot Takibi
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasExpirationTracking"
                      checked={formData.hasExpirationTracking || false}
                      onChange={(e) => setFormData({...formData, hasExpirationTracking: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <label htmlFor="hasExpirationTracking" className="text-sm font-medium text-gray-700">
                      SKT Takibi
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Depo ve Stok Dağılımı</label>
                  <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">Toplam Stok: {formData.stock} {formData.unit || 'Adet'}</span>
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
                      step="0.01"
                      placeholder="Miktar"
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md flex flex-col max-h-[95vh] overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg text-gray-800">{isCategoryEditing ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</h3>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveCategory} className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Kategoriler</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={newSubCategory}
                      onChange={(e) => setNewSubCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newSubCategory.trim() && !categoryFormData.subCategories?.includes(newSubCategory.trim())) {
                            setCategoryFormData({...categoryFormData, subCategories: [...(categoryFormData.subCategories || []), newSubCategory.trim()]});
                            setNewSubCategory('');
                          }
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Yeni alt kategori..."
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newSubCategory.trim() && !categoryFormData.subCategories?.includes(newSubCategory.trim())) {
                          setCategoryFormData({...categoryFormData, subCategories: [...(categoryFormData.subCategories || []), newSubCategory.trim()]});
                          setNewSubCategory('');
                        }
                      }}
                      className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(categoryFormData.subCategories || []).map((subCat, index) => (
                      <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        <span className="text-gray-700">{subCat}</span>
                        <button 
                          type="button"
                          onClick={() => setCategoryFormData({...categoryFormData, subCategories: categoryFormData.subCategories?.filter((_, i) => i !== index)})}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {(categoryFormData.subCategories || []).length === 0 && (
                      <div className="text-sm text-gray-400 p-2 text-center w-full bg-gray-50 rounded border border-dashed">
                        Henüz alt kategori eklenmedi.
                      </div>
                    )}
                  </div>
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md flex flex-col max-h-[95vh] overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg text-gray-800">{isBrandEditing ? 'Marka Düzenle' : 'Yeni Marka Ekle'}</h3>
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveBrand} className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
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
            <div className="p-3 sm:p-4">
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

      {/* Bulk Barcode Print Modal */}
      {isBarcodePrintModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Printer size={20} className="text-blue-600" />
                Toplu Barkod Yazdır
              </h3>
              <button 
                onClick={() => setIsBarcodePrintModalOpen(false)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-3 sm:p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <p className="text-gray-600 mb-4 text-sm">Aşağıdaki ürünler için yazdırılacak barkod etiketi sayısını belirleyebilirsiniz.</p>
              
              <div className="space-y-3">
                {barcodePrintOptions.map((opt, index) => (
                  <div key={opt.product.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-gray-50 gap-3">
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-gray-800 truncate" title={opt.product.name}>{opt.product.name}</div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>Kodu: {opt.product.code}</span>
                        <span>Barkod: {opt.product.barcode || '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-gray-500 font-medium">Adet:</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="w-16 border rounded px-2 py-1 text-center"
                        value={opt.count}
                        onChange={(e) => {
                          const newOpts = [...barcodePrintOptions];
                          newOpts[index].count = Number(e.target.value) || 0;
                          setBarcodePrintOptions(newOpts);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsBarcodePrintModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button 
                onClick={handleBulkPrintBarcode}
                disabled={barcodePrintOptions.every(o => o.count === 0)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={18} />
                Yazdır ({barcodePrintOptions.reduce((acc, curr) => acc + curr.count, 0)})
              </button>
            </div>
          </div>
        </div>
      )}

      {isPriceRevisionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Fiyat Revizyon Aracı</h3>
              <button 
                type="button" 
                onClick={() => setIsPriceRevisionModalOpen(false)} 
                className="text-gray-500 hover:text-red-500 transition-colors"
                disabled={isRevisionLoading}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApplyPriceRevision} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Filtresi</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={revisionForm.category}
                  onChange={e => setRevisionForm({...revisionForm, category: e.target.value})}
                  disabled={isRevisionLoading}
                >
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marka Filtresi</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={revisionForm.brand}
                  onChange={e => setRevisionForm({...revisionForm, brand: e.target.value})}
                  disabled={isRevisionLoading}
                >
                  <option value="all">Tüm Markalar</option>
                  {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Yönü</label>
                   <select 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                     value={revisionForm.type}
                     onChange={e => setRevisionForm({...revisionForm, type: e.target.value})}
                     disabled={isRevisionLoading}
                   >
                     <option value="increase">Artış (+)</option>
                     <option value="decrease">İndirim (-)</option>
                   </select>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Yüzde (%)</label>
                   <input 
                     type="number"
                     min="0.1"
                     step="0.1"
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                     value={revisionForm.percentage}
                     onChange={e => setRevisionForm({...revisionForm, percentage: Number(e.target.value)})}
                     disabled={isRevisionLoading}
                   />
                 </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsPriceRevisionModalOpen(false)}
                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                   disabled={isRevisionLoading}
                 >
                   İptal
                 </button>
                 <button 
                   type="submit" 
                   disabled={isRevisionLoading}
                   className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                 >
                   {isRevisionLoading ? 'İşleniyor...' : 'Uygula'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <BarcodeScanner
          onScan={(barcode) => {
            if (activeScannerTarget === 'search') {
              setSearchTerm(barcode);
            } else {
              setFormData({ ...formData, barcode });
            }
            setIsScannerOpen(false);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

    </div>
  );
};