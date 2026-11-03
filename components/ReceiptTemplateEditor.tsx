import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';
import { AlignLeft, AlignCenter, AlignRight, EyeOff, Save, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';

interface ReceiptTemplateEditorProps {
  store: any;
}

export const ReceiptTemplateEditor: React.FC<ReceiptTemplateEditorProps> = ({ store }) => {
  const [formData, setFormData] = useState<Partial<Settings>>({
    receiptTemplate_logoPosition: 'center',
    receiptTemplate_logoSize: 180,
    receiptTemplate_showTaxInfo: true,
    receiptTemplate_showAddress: true,
    receiptTemplate_showPhone: true,
    receiptTemplate_fontSize: '12px',
    receiptTemplate_paperWidth: '300px',
    printer_header_text: '',
    printer_footer_text: 'Bizi tercih ettiğiniz için teşekkür ederiz.'
  });
  const [isSaved, setIsSaved] = useState(false);
  const [fitToScreen, setFitToScreen] = useState(true);
  const [scale, setScale] = useState(1);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const receiptPaperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (store.settings) {
      setFormData({
        ...formData,
        receiptTemplate_logoPosition: store.settings.receiptTemplate_logoPosition || 'center',
        receiptTemplate_logoSize: store.settings.receiptTemplate_logoSize || 180,
        receiptTemplate_showTaxInfo: store.settings.receiptTemplate_showTaxInfo !== false,
        receiptTemplate_showAddress: store.settings.receiptTemplate_showAddress !== false,
        receiptTemplate_showPhone: store.settings.receiptTemplate_showPhone !== false,
        receiptTemplate_fontSize: store.settings.receiptTemplate_fontSize || '12px',
        receiptTemplate_paperWidth: store.settings.receiptTemplate_paperWidth || '300px',
        printer_header_text: store.settings.printer_header_text || '',
        printer_footer_text: store.settings.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.',
      });
    }
  }, [store.settings]);

  // Automatically compute scale so the entire receipt fits inside the preview panel without scrolling
  useEffect(() => {
    const updateScale = () => {
      if (!fitToScreen || !previewContainerRef.current || !receiptPaperRef.current) {
        setScale(1);
        return;
      }
      const container = previewContainerRef.current;
      const paper = receiptPaperRef.current;

      const availableWidth = container.clientWidth - 32;
      const availableHeight = container.clientHeight - 48;

      const naturalWidth = paper.offsetWidth || 300;
      const naturalHeight = paper.offsetHeight || 420;

      const widthRatio = availableWidth / naturalWidth;
      const heightRatio = availableHeight / naturalHeight;

      const nextScale = Math.min(1, widthRatio, heightRatio);
      setScale(Number.isFinite(nextScale) && nextScale > 0.35 ? nextScale : 1);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [fitToScreen, formData, store.settings]);

  const handleSave = () => {
    store.setSettings({
      ...store.settings,
      ...formData
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const storeName = store.settings?.companyName || 'ESİLA TİCARİ';
  const storeAddress = formData.receiptTemplate_showAddress ? (store.settings?.address || 'Örnek Adres Mahallesi') : '';
  const storePhone = formData.receiptTemplate_showPhone ? (store.settings?.phone || '0555 555 55 55') : '';
  const taxOffice = formData.receiptTemplate_showTaxInfo ? (store.settings?.taxOffice || 'Örnek V.D.') : '';
  const taxNumber = formData.receiptTemplate_showTaxInfo ? (store.settings?.taxNumber || '11111111111') : '';
  const companyLogo = formData.receiptTemplate_logoPosition !== 'hidden' ? store.settings?.companyLogo : undefined;
  const fontSize = formData.receiptTemplate_fontSize || '12px';
  const fontPx = parseInt(fontSize, 10) || 12;
  const paperWidth = formData.receiptTemplate_paperWidth || '300px';

  const sampleItems = [
    { name: 'Örnek Ürün 1', quantity: 2, price: 50.0, total: 100.0 },
    { name: 'Örnek Ürün 2', quantity: 1, price: 150.0, total: 150.0 },
  ];

  const logoAlign =
    formData.receiptTemplate_logoPosition === 'left'
      ? 'left'
      : formData.receiptTemplate_logoPosition === 'right'
      ? 'right'
      : 'center';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Sol Kontroller */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Logo ve Başlık Yerleşimi</h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Logo Konumu</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, receiptTemplate_logoPosition: 'left' })}
                className={`flex flex-col items-center py-2 px-2 rounded-lg border transition-colors ${
                  formData.receiptTemplate_logoPosition === 'left'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <AlignLeft size={16} className="mb-1" />
                <span className="text-[11px] font-medium">Sola Dayalı</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, receiptTemplate_logoPosition: 'center' })}
                className={`flex flex-col items-center py-2 px-2 rounded-lg border transition-colors ${
                  formData.receiptTemplate_logoPosition === 'center'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <AlignCenter size={16} className="mb-1" />
                <span className="text-[11px] font-medium">Ortalı</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, receiptTemplate_logoPosition: 'right' })}
                className={`flex flex-col items-center py-2 px-2 rounded-lg border transition-colors ${
                  formData.receiptTemplate_logoPosition === 'right'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <AlignRight size={16} className="mb-1" />
                <span className="text-[11px] font-medium">Sağa Dayalı</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, receiptTemplate_logoPosition: 'hidden' })}
                className={`flex flex-col items-center py-2 px-2 rounded-lg border transition-colors ${
                  formData.receiptTemplate_logoPosition === 'hidden'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <EyeOff size={16} className="mb-1" />
                <span className="text-[11px] font-medium">Gizli</span>
              </button>
            </div>
          </div>

          {formData.receiptTemplate_logoPosition !== 'hidden' && (
            <div>
              <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                <span>Logo Genişliği</span>
                <span className="font-mono font-semibold text-gray-800">{formData.receiptTemplate_logoSize}px</span>
              </div>
              <input
                type="range"
                min="50"
                max="280"
                step="10"
                value={formData.receiptTemplate_logoSize || 180}
                onChange={(e) => setFormData({ ...formData, receiptTemplate_logoSize: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2.5">
          <h3 className="text-sm font-bold text-gray-800">Görünürlük ve Metin</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg bg-gray-50 cursor-pointer">
              <span className="text-xs font-medium text-gray-700">Vergi / VKN</span>
              <input
                type="checkbox"
                className="accent-emerald-600 w-4 h-4"
                checked={Boolean(formData.receiptTemplate_showTaxInfo)}
                onChange={(e) => setFormData({ ...formData, receiptTemplate_showTaxInfo: e.target.checked })}
              />
            </label>

            <label className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg bg-gray-50 cursor-pointer">
              <span className="text-xs font-medium text-gray-700">Açık Adres</span>
              <input
                type="checkbox"
                className="accent-emerald-600 w-4 h-4"
                checked={Boolean(formData.receiptTemplate_showAddress)}
                onChange={(e) => setFormData({ ...formData, receiptTemplate_showAddress: e.target.checked })}
              />
            </label>

            <label className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg bg-gray-50 cursor-pointer">
              <span className="text-xs font-medium text-gray-700">Telefon No</span>
              <input
                type="checkbox"
                className="accent-emerald-600 w-4 h-4"
                checked={Boolean(formData.receiptTemplate_showPhone)}
                onChange={(e) => setFormData({ ...formData, receiptTemplate_showPhone: e.target.checked })}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Üst Başlık (Opsiyonel)</label>
              <input
                type="text"
                value={formData.printer_header_text || ''}
                onChange={(e) => setFormData({ ...formData, printer_header_text: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Örn: BİLGİ FİŞİ"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alt Bilgi Metni (Footer)</label>
              <input
                type="text"
                value={formData.printer_footer_text || ''}
                onChange={(e) => setFormData({ ...formData, printer_footer_text: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Bizi tercih ettiğiniz için teşekkür ederiz."
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-2.5">Görünüm Ayarları</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Font Boyutu</label>
              <select
                value={formData.receiptTemplate_fontSize || '12px'}
                onChange={(e) => setFormData({ ...formData, receiptTemplate_fontSize: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="10px">Çok Küçük (10px)</option>
                <option value="11px">Küçük (11px)</option>
                <option value="12px">Normal (12px)</option>
                <option value="14px">Büyük (14px)</option>
                <option value="16px">Çok Büyük (16px)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kağıt Genişliği</label>
              <select
                value={formData.receiptTemplate_paperWidth || '300px'}
                onChange={(e) => setFormData({ ...formData, receiptTemplate_paperWidth: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="200px">58mm (200px)</option>
                <option value="300px">80mm (300px)</option>
                <option value="400px">100mm (400px)</option>
                <option value="500px">Geniş (500px)</option>
                <option value="100%">Tam Genişlik (100%)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition-colors ${
            isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 size={18} />
              Kaydedildi
            </>
          ) : (
            <>
              <Save size={18} />
              Şablonu Kaydet
            </>
          )}
        </button>
      </div>

      {/* Sağ Canlı Önizleme - Kaydırmadan Tam Görünüm */}
      <div
        ref={previewContainerRef}
        className="lg:col-span-6 bg-slate-100 p-4 rounded-xl flex flex-col items-center justify-between border border-gray-200 relative overflow-hidden min-h-[430px]"
      >
        <div className="w-full flex items-center justify-between mb-2 shrink-0">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Canlı Fiş Önizleme ({paperWidth === '200px' ? '58mm' : paperWidth === '300px' ? '80mm' : paperWidth})
          </h4>
          <button
            type="button"
            onClick={() => setFitToScreen(!fitToScreen)}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs"
          >
            {fitToScreen ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            <span>{fitToScreen ? 'Ekrana Sığdırıldı' : '1:1 Boyut'}</span>
          </button>
        </div>

        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
          <div
            ref={receiptPaperRef}
            className="bg-white text-black shadow-xl border border-gray-200 transition-transform duration-150 origin-center"
            style={{
              width: paperWidth === '100%' ? '100%' : paperWidth,
              maxWidth: '100%',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: fontSize,
              lineHeight: 1.25,
              padding: '12px',
              boxSizing: 'border-box',
              transform: fitToScreen && scale < 1 ? `scale(${scale})` : 'none'
            }}
          >
            {companyLogo && (
              <div style={{ textAlign: logoAlign as any, marginBottom: '8px' }}>
                <img
                  src={companyLogo}
                  alt="Logo"
                  style={{
                    maxWidth: `${formData.receiptTemplate_logoSize || 180}px`,
                    maxHeight: '70px',
                    display: 'inline-block',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}

            {formData.printer_header_text && (
              <div
                className="text-center font-bold"
                style={{ fontSize: `${fontPx + 3}px`, marginBottom: '4px' }}
              >
                {formData.printer_header_text}
              </div>
            )}

            <div
              className="text-center font-bold"
              style={{ fontSize: `${fontPx + 2}px`, marginBottom: '4px' }}
            >
              {storeName}
            </div>

            {storeAddress && (
              <div className="text-center" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
                {storeAddress}
              </div>
            )}
            {storePhone && (
              <div className="text-center" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
                Tel: {storePhone}
              </div>
            )}
            {(taxOffice || taxNumber) && (
              <div className="text-center" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
                {taxOffice ? `V.D: ${taxOffice}` : ''} {taxNumber ? `V.No: ${taxNumber}` : ''}
              </div>
            )}

            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

            <div className="flex justify-between" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
              <span>Tarih:</span>
              <span>{new Date().toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
              <span>Fiş No:</span>
              <span>FS-1001</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
              <span>Müşteri:</span>
              <span>Örnek Müşteri</span>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

            <div
              className="flex justify-between font-bold"
              style={{ fontSize: `${Math.max(9, fontPx - 2)}px`, marginBottom: '4px' }}
            >
              <span>Ürün</span>
              <span>Miktar x Fiyat</span>
            </div>

            {sampleItems.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start"
                style={{ fontSize: `${Math.max(9, fontPx - 2)}px`, marginBottom: '4px' }}
              >
                <div style={{ flex: 1, paddingRight: '6px' }}>{item.name}</div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div>
                    {item.quantity} x {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div>{item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            <div className="flex justify-between" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
              <span>Ara Toplam:</span>
              <span>250,00 TL</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: `${Math.max(9, fontPx - 2)}px` }}>
              <span>KDV Toplamı:</span>
              <span>0,00 TL</span>
            </div>

            <div
              className="flex justify-between font-bold"
              style={{ fontSize: `${fontPx + 2}px`, marginTop: '4px' }}
            >
              <span>Genel Toplam:</span>
              <span>250,00 TL</span>
            </div>

            <div
              className="flex justify-between font-bold"
              style={{ fontSize: `${Math.max(9, fontPx - 2)}px`, marginTop: '4px' }}
            >
              <span>Ödeme Tipi:</span>
              <span>Kredi Kartı</span>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            <div
              className="text-center"
              style={{
                fontSize: `${Math.max(9, fontPx - 2)}px`,
                whiteSpace: 'pre-wrap'
              }}
            >
              {formData.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
