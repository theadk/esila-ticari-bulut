import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { Product } from '../types';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, CheckCircle, AlertTriangle, X, Play, Square, FileText, Search, Plus, Minus, Mic, MicOff, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { hasPermission } from '../lib/permissions';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';

interface CountedProduct {
  productId: string;
  code: string;
  barcode?: string;
  name: string;
  systemStock: number;
  countedStock: number;
}

type SearchScope = 'all' | 'name' | 'code' | 'barcode' | 'other';

interface VoiceMatchResult {
  product: Product;
  matchedFields: string[];
  score: number;
}

const SPOKEN_NUMBERS: Record<string, string> = {
  'sıfır': '0',
  'bir': '1',
  'iki': '2',
  'üç': '3',
  'dört': '4',
  'beş': '5',
  'altı': '6',
  'yedi': '7',
  'sekiz': '8',
  'dokuz': '9',
  'on': '10',
  'yirmi': '20',
  'otuz': '30',
  'kırk': '40',
  'elli': '50',
  'altmış': '60',
  'yetmiş': '70',
  'seksen': '80',
  'doksan': '90',
  'yüz': '100'
};

const normalizeTr = (str?: string): string => {
  if (!str) return '';
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,!?;:"'()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeAscii = (str?: string): string => {
  return normalizeTr(str)
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

const normalizeCode = (str?: string): string => {
  return normalizeAscii(str).replace(/[\s\-_./\\]/g, '');
};

const replaceSpokenNumbers = (text: string): string => {
  return text
    .split(/\s+/)
    .map(word => SPOKEN_NUMBERS[word] ?? word)
    .join(' ');
};

const parseVoiceCommand = (rawText: string): {
  cleanQuery: string;
  digitsQuery: string;
  detectedScope: SearchScope | null;
  detectedQuantity: number;
} => {
  let working = normalizeTr(rawText);
  let detectedScope: SearchScope | null = null;
  let detectedQuantity = 1;

  // Detect spoken quantity at the end, e.g. "5 adet", "beş tane", "10 kutu", "3 koli"
  const withDigits = replaceSpokenNumbers(working);
  const qtyRegex = /\b(\d+)\s*(adet|tane|kutu|koli|paket|ambalaj|kg|kilo|gram|lt|litre|metre|çift|set)\s*$/i;
  const qtyMatch = withDigits.match(qtyRegex);
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1], 10);
    if (!isNaN(parsedQty) && parsedQty > 0) {
      detectedQuantity = parsedQty;
    }
    working = withDigits.replace(qtyRegex, '').trim();
  }

  // Detect explicit field definitions spoken by the user
  const prefixPatterns: { pattern: RegExp; scope: SearchScope }[] = [
    { pattern: /^(ürün\s+adı|ürünün\s+adı|ürün\s+ismi|ürün\s+tanımı|ürün\s+ismine\s+göre|ürün\s+adına\s+göre|ürün\s+adıyla|isim|adı|ad)\s+/i, scope: 'name' },
    { pattern: /^(stok\s+kodu|stok\s+koduna\s+göre|stok\s+koduyla|stok\s+kod|ürün\s+kodu|malzeme\s+kodu|referans\s+kodu|kodu|kod)\s+/i, scope: 'code' },
    { pattern: /^(barkod\s+numarası|barkod\s+kodu|barkoduna\s+göre|barkodu|barkod\s+no|barkod)\s+/i, scope: 'barcode' },
    { pattern: /^(marka\s+adı|markası|marka|kategori\s+adı|kategorisi|kategori|açıklaması|açıklama|tanımı|tanım|raf\s+no|raf\s+kodu|rafı|raf|seri\s+numarası|seri\s+no)\s+/i, scope: 'other' },
  ];

  for (const item of prefixPatterns) {
    if (item.pattern.test(working)) {
      detectedScope = item.scope;
      working = working.replace(item.pattern, '').trim();
      break;
    }
  }

  // Also strip common trailing action words like "ara", "bul", "say", "getir", "ekle"
  working = working
    .replace(/\s+(ara|bul|sorgula|say|sayıma\s+ekle|ekle|getir|göster)$/i, '')
    .replace(/^(ürün|stok)\s+/i, (match) => {
      // Only strip leading "ürün " or "stok " if there are more words after it
      const rest = working.slice(match.length).trim();
      return rest.length > 0 ? '' : match;
    })
    .trim();

  const cleanQuery = working || normalizeTr(rawText);
  const digitsQuery = replaceSpokenNumbers(cleanQuery);

  return {
    cleanQuery,
    digitsQuery,
    detectedScope,
    detectedQuantity,
  };
};

export const StokSayim: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'stoksayim', 'view');
  
  const { products } = store;
  const [isScanning, setIsScanning] = useState(false);
  const [countedItems, setCountedItems] = useState<CountedProduct[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { isListening, supported, listen, stop } = useSpeechRecognition();
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceResults, setVoiceResults] = useState<VoiceMatchResult[]>([]);
  const [voiceScope, setVoiceScope] = useState<SearchScope>('all');
  const [voiceQuantity, setVoiceQuantity] = useState<number>(1);
  const [autoAddSingleMatch, setAutoAddSingleMatch] = useState<boolean>(false);
  const [isSearchingVoice, setIsSearchingVoice] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, []);

  const getProductTotalStock = (p: Product) => {
    if (p.warehouseStocks && p.warehouseStocks.length > 0) {
      return p.warehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
    }
    return Number(p.stock) || 0;
  };

  const addProductToCount = (product: Product, quantityToAdd: number = 1) => {
    const validQty = Math.max(1, Number(quantityToAdd) || 1);
    setCountedItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, countedStock: item.countedStock + validQty }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            code: product.code || '-',
            barcode: product.barcode,
            name: product.name,
            systemStock: getProductTotalStock(product),
            countedStock: validQty,
          },
        ];
      }
    });
  };

  const searchProductsByDefinitions = (rawText: string, explicitScope: SearchScope = voiceScope): {
    results: VoiceMatchResult[];
    parsed: ReturnType<typeof parseVoiceCommand>;
  } => {
    const parsed = parseVoiceCommand(rawText);
    const activeScope: SearchScope = explicitScope !== 'all' ? explicitScope : (parsed.detectedScope || 'all');

    const qTr = parsed.cleanQuery;
    const qDigits = parsed.digitsQuery;
    const qAscii = normalizeAscii(qDigits);
    const qCode = normalizeCode(qDigits);
    const qRawCode = normalizeCode(rawText);

    if (!qTr && !qCode) {
      return { results: [], parsed };
    }

    const queryTokens = qAscii.split(/\s+/).filter(t => t.length > 0);

    const results: VoiceMatchResult[] = [];

    for (const p of products) {
      const matchedFields: string[] = [];
      let score = 0;

      const nameTr = normalizeTr(p.name);
      const nameAscii = normalizeAscii(p.name);
      const codeTr = normalizeTr(p.code);
      const codeCompact = normalizeCode(p.code);
      const barcodeCompact = normalizeCode(p.barcode);
      const brandAscii = normalizeAscii(p.brand);
      const categoryAscii = normalizeAscii(`${p.category || ''} ${p.subCategory || ''}`);
      const descAscii = normalizeAscii(p.description);
      const locationAscii = normalizeAscii(`${p.warehouse || ''} ${p.aisle || ''} ${p.shelf || ''}`);
      const serialsVariantsAscii = normalizeAscii(
        `${(p.variants || []).join(' ')} ${(p.serials || []).join(' ')}`
      );

      // 1. Stok Kodu Arama
      if (activeScope === 'all' || activeScope === 'code') {
        if (codeCompact && qCode) {
          if (codeCompact === qCode || codeCompact === qRawCode) {
            score += 120;
            matchedFields.push('Stok Kodu (Tam)');
          } else if (codeCompact.startsWith(qCode) || qCode.includes(codeCompact)) {
            score += 90;
            matchedFields.push('Stok Kodu');
          } else if (codeCompact.includes(qCode) || (codeTr && codeTr.includes(qTr))) {
            score += 75;
            matchedFields.push('Stok Kodu');
          }
        }
      }

      // 2. Barkod Arama
      if (activeScope === 'all' || activeScope === 'barcode') {
        if (barcodeCompact && qCode) {
          if (barcodeCompact === qCode || barcodeCompact === qRawCode) {
            score += 120;
            matchedFields.push('Barkod (Tam)');
          } else if (barcodeCompact.includes(qCode) || qCode.includes(barcodeCompact)) {
            score += 85;
            matchedFields.push('Barkod');
          }
        }
      }

      // 3. Ürün Adı Arama
      if (activeScope === 'all' || activeScope === 'name') {
        if (nameTr || nameAscii) {
          if (nameTr === qTr || nameAscii === qAscii) {
            score += 110;
            matchedFields.push('Ürün Adı (Tam)');
          } else if (nameTr.startsWith(qTr) || nameAscii.startsWith(qAscii)) {
            score += 85;
            matchedFields.push('Ürün Adı');
          } else if (nameTr.includes(qTr) || nameAscii.includes(qAscii) || nameTr.includes(qDigits)) {
            score += 70;
            matchedFields.push('Ürün Adı');
          } else if (
            queryTokens.length > 1 &&
            queryTokens.every(token => nameAscii.includes(token))
          ) {
            score += 65;
            matchedFields.push('Ürün Adı');
          }
        }
      }

      // 4. Marka, Kategori, Açıklama/Tanım, Raf, Varyant/Seri No Arama
      if (activeScope === 'all' || activeScope === 'other') {
        if (brandAscii && (brandAscii.includes(qAscii) || qAscii.includes(brandAscii))) {
          score += 50;
          matchedFields.push('Marka');
        }
        if (categoryAscii.trim() && categoryAscii.includes(qAscii)) {
          score += 40;
          matchedFields.push('Kategori');
        }
        if (descAscii && descAscii.includes(qAscii)) {
          score += 45;
          matchedFields.push('Tanım / Açıklama');
        }
        if (locationAscii.trim() && locationAscii.includes(qAscii)) {
          score += 35;
          matchedFields.push('Raf / Depo Konumu');
        }
        if (serialsVariantsAscii.trim() && serialsVariantsAscii.includes(qAscii)) {
          score += 55;
          matchedFields.push('Varyant / Seri No');
        }
      }

      // 5. Çoklu kelime birleşik tanım eşleşmesi (örn. "Samsung STK 01" veya "Mavi Kablo Kod 102")
      if (score === 0 && activeScope === 'all' && queryTokens.length > 0) {
        const combinedSearchSpace = `${nameAscii} ${codeCompact} ${barcodeCompact} ${brandAscii} ${categoryAscii} ${descAscii} ${locationAscii} ${serialsVariantsAscii}`;
        const matchedTokenCount = queryTokens.filter(t => combinedSearchSpace.includes(t) || combinedSearchSpace.includes(normalizeCode(t))).length;
        if (matchedTokenCount === queryTokens.length) {
          score += 55;
          matchedFields.push('Çoklu Tanım Eşleşmesi');
        } else if (queryTokens.length >= 2 && matchedTokenCount >= queryTokens.length - 1) {
          score += 30;
          matchedFields.push('Kısmi Tanım Eşleşmesi');
        }
      }

      if (score > 0) {
        results.push({
          product: p,
          matchedFields: Array.from(new Set(matchedFields)),
          score,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return { results, parsed };
  };

  const executeVoiceOrTextLookup = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const { results, parsed } = searchProductsByDefinitions(trimmed, voiceScope);
    setVoiceQuantity(parsed.detectedQuantity || 1);
    setVoiceResults(results);

    if (results.length > 0) {
      const top = results[0];
      if (autoAddSingleMatch && (results.length === 1 || top.score >= 110)) {
        addProductToCount(top.product, parsed.detectedQuantity || 1);
        toast.success(
          `${top.product.name} (${top.product.code}) +${parsed.detectedQuantity || 1} adet sayıma eklendi!`
        );
      } else {
        toast.success(
          results.length === 1
            ? `Ürün bulundu: ${top.product.name} (${top.product.code})`
            : `${results.length} eşleşen ürün bulundu.`
        );
      }
    } else {
      toast.error(`"${trimmed}" tanımına uygun ürün bulunamadı.`);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    processBarcode(decodedText);
    toast.success(`Barkod Okundu: ${decodedText}`);
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      stop();
      setIsSearchingVoice(false);
      if (voiceQuery.trim()) {
        executeVoiceOrTextLookup(voiceQuery);
      }
      return;
    }

    setVoiceQuery('');
    setVoiceResults([]);
    setIsSearchingVoice(true);

    listen((text, isFinal) => {
      setVoiceQuery(text);
      if (isFinal && text.trim().length > 0) {
        stop();
        setIsSearchingVoice(false);
        executeVoiceOrTextLookup(text);
      }
    }, () => {
      setIsSearchingVoice(false);
    });
  };

  const processBarcode = (inputQuery: string) => {
    const trimmed = inputQuery.trim();
    if (!trimmed) return;

    const qCode = normalizeCode(trimmed);
    const qTr = normalizeTr(trimmed);

    // First check exact barcode or stock code
    let product = products.find(
      p =>
        (p.barcode && (p.barcode === trimmed || normalizeCode(p.barcode) === qCode)) ||
        (p.code && (p.code === trimmed || normalizeCode(p.code) === qCode)) ||
        (p.name && normalizeTr(p.name) === qTr)
    );

    // If not exact, fallback to smart definition search
    if (!product) {
      const { results, parsed } = searchProductsByDefinitions(trimmed, 'all');
      if (results.length === 1) {
        addProductToCount(results[0].product, parsed.detectedQuantity || 1);
        toast.success(`${results[0].product.name} (${results[0].product.code}) sayıma eklendi.`);
        return;
      } else if (results.length > 1) {
        setVoiceQuery(trimmed);
        setVoiceResults(results);
        setVoiceQuantity(parsed.detectedQuantity || 1);
        toast.success(`${results.length} ürün eşleşti, listeden seçebilirsiniz.`);
        return;
      } else {
        toast.error('Bu barkod, stok kodu veya ürün adına ait ürün bulunamadı!', { id: 'barcode-error' });
        return;
      }
    }

    addProductToCount(product, 1);
    toast.success(`${product.name} (${product.code}) sayıma eklendi.`);
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
      scannerRef.current.render(handleScanSuccess, () => {
        // ignore continuous scan frame errors
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

  const setExactCount = (productId: string, amount: number) => {
    setCountedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, countedStock: Math.max(0, amount) };
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
                const globalWhIdx = newWarehouseStocks.findIndex(w => w.warehouseId === product.warehouse || w.warehouseId === 'Merkez');
                if (globalWhIdx > -1) {
                   newWarehouseStocks[globalWhIdx] = { ...newWarehouseStocks[globalWhIdx], stock: item.countedStock };
                } else if (newWarehouseStocks.length === 1) {
                   newWarehouseStocks[0] = { ...newWarehouseStocks[0], stock: item.countedStock };
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
          <p className="text-gray-600 mt-1">Sesli komutlarla (ürün adı, stok kodu, barkod, tanım), kamera ile veya elle stok sayımı yapın.</p>
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
          
          {/* Sesli Stok Sayım & Sorgulama */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10"></div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <Volume2 className="text-indigo-600" size={20} /> Sesli Sayım & Sorgulama
              </h3>
              {voiceResults.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setVoiceResults([]);
                    setVoiceQuery('');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Temizle
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Mikrofona tıklayarak <strong>ürün adı</strong>, <strong>stok kodu</strong>, <strong>barkod</strong>, <strong>marka</strong> veya <strong>açıklama/tanım</strong> söyleyin. (Örn: <em>"Stok kodu STK 001"</em>, <em>"Ürün adı Laptop 5 adet"</em>)
            </p>

            {/* Arama Kapsamı Seçimi */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                { id: 'all', label: 'Tüm Tanımlar' },
                { id: 'name', label: 'Ürün Adı' },
                { id: 'code', label: 'Stok Kodu' },
                { id: 'barcode', label: 'Barkod' },
                { id: 'other', label: 'Marka / Tanım' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    const nextScope = tab.id as SearchScope;
                    setVoiceScope(nextScope);
                    if (voiceQuery.trim()) {
                      const { results } = searchProductsByDefinitions(voiceQuery, nextScope);
                      setVoiceResults(results);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                    voiceScope === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Otomatik Ekleme Seçeneği */}
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-4 cursor-pointer select-none bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
              <input
                type="checkbox"
                checked={autoAddSingleMatch}
                onChange={(e) => setAutoAddSingleMatch(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Tek veya tam eşleşmede <strong>otomatik sayıma ekle</strong></span>
            </label>
            
            <div className="flex flex-col items-center">
              {supported ? (
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
                    isListening
                      ? 'bg-red-500 animate-pulse scale-110'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                  }`}
                  title={isListening ? 'Dinlemeyi Durdur' : 'Sesli Aramayı Başlat'}
                >
                  {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-2 text-center">
                  Tarayıcınız ses tanımayı desteklemiyor. Aşağıdaki kutudan ürün adı veya stok kodu ile arayabilirsiniz.
                </div>
              )}
              
              <div className="mt-3 text-center min-h-[20px]">
                {isListening && (
                  <span className="text-xs font-medium text-indigo-600 italic">
                    "{voiceQuery || 'Dinleniyor... (Ürün adı, stok kodu veya adet söyleyin)'}"
                  </span>
                )}
                {!isListening && voiceQuery && voiceResults.length === 0 && (
                  <span className="text-xs font-medium text-red-500">
                    Sonuç bulunamadı: "{voiceQuery}"
                  </span>
                )}
              </div>

              {/* Sesli Metin Düzenleme / Hızlı Tanım Sorgulama */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeVoiceOrTextLookup(voiceQuery);
                }}
                className="w-full mt-2 flex gap-1.5"
              >
                <input
                  type="text"
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  placeholder='Örn: "Stok kodu STK-001" veya "Ürün adı..."'
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
                >
                  Ara
                </button>
              </form>
            </div>

            {voiceResults.length > 0 && !isListening && (
              <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>Bulunan Ürünler ({voiceResults.length})</span>
                  <div className="flex items-center gap-1">
                    <span>Eklenecek Adet:</span>
                    <input
                      type="number"
                      min={1}
                      value={voiceQuantity}
                      onChange={(e) => setVoiceQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-14 px-1.5 py-0.5 text-center border border-gray-300 rounded font-bold text-indigo-700 bg-white"
                    />
                  </div>
                </div>

                {voiceResults.map(({ product, matchedFields }) => {
                  const sysStock = getProductTotalStock(product);
                  return (
                    <div
                      key={product.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-gray-800 truncate">{product.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                              Stok Kodu: <strong>{product.code || '-'}</strong>
                            </span>
                            {product.barcode && (
                              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                Barkod: {product.barcode}
                              </span>
                            )}
                            {product.brand && <span>Marka: {product.brand}</span>}
                            {product.category && <span>Kat: {product.category}</span>}
                            {(product.shelf || product.aisle) && (
                              <span>Konum: {[product.aisle, product.shelf].filter(Boolean).join('/')}</span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                              Tanım: {product.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {matchedFields.map((field) => (
                              <span
                                key={field}
                                className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-semibold"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          Sistem Stoku:{' '}
                          <span className="font-bold text-indigo-700 text-sm">{sysStock}</span>{' '}
                          {product.unit || 'Adet'}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            addProductToCount(product, voiceQuantity);
                            toast.success(`${product.name} (+${voiceQuantity}) sayıma eklendi.`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Plus size={14} /> Sayıma Ekle (+{voiceQuantity})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kamera ve Barkod */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Manuel Barkod / Stok Kodu / Ürün Adı Girişi</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Barkod, stok kodu veya ürün adı girin..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
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
