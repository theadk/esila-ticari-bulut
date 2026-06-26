import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { AlignLeft, AlignCenter, AlignRight, EyeOff, Save, CheckCircle2 } from 'lucide-react';
import { generateThermalReceiptHtml } from '../lib/printUtils';

interface ReceiptTemplateEditorProps {
  store: any;
}

export const ReceiptTemplateEditor: React.FC<ReceiptTemplateEditorProps> = ({ store }) => {
  const [formData, setFormData] = useState<Partial<Settings>>({
    receiptTemplate_logoPosition: 'center',
    receiptTemplate_logoSize: 200,
    receiptTemplate_showTaxInfo: true,
    receiptTemplate_showAddress: true,
    receiptTemplate_showPhone: true,
    receiptTemplate_fontSize: '12px',
    receiptTemplate_paperWidth: '300px'
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (store.settings) {
      setFormData({
        ...formData,
        receiptTemplate_logoPosition: store.settings.receiptTemplate_logoPosition || 'center',
        receiptTemplate_logoSize: store.settings.receiptTemplate_logoSize || 200,
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

  const handleSave = () => {
    store.setSettings({
      ...store.settings,
      ...formData
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const previewHtml = generateThermalReceiptHtml({
    storeName: store.settings?.companyName || 'ESİLA TİCARİ',
    storeAddress: formData.receiptTemplate_showAddress ? (store.settings?.address || 'Örnek Adres Mahallesi') : '',
    storePhone: formData.receiptTemplate_showPhone ? (store.settings?.phone || '0555 555 55 55') : '',
    taxOffice: formData.receiptTemplate_showTaxInfo ? (store.settings?.taxOffice || 'Örnek V.D.') : '',
    taxNumber: formData.receiptTemplate_showTaxInfo ? (store.settings?.taxNumber || '11111111111') : '',
    companyLogo: formData.receiptTemplate_logoPosition !== 'hidden' ? store.settings?.companyLogo : undefined,
    date: new Date().toLocaleString('tr-TR'),
    receiptNumber: 'FS-1001',
    customerName: 'Örnek Müşteri',
    items: [
      { name: 'Örnek Ürün 1', quantity: 2, price: 50.00, total: 100.00 },
      { name: 'Örnek Ürün 2', quantity: 1, price: 150.00, total: 150.00 },
    ],
    subTotal: 250.00,
    taxTotal: 0.00,
    total: 250.00,
    paymentMethod: 'Kredi Kartı',
    footerText: formData.printer_footer_text,
    headerText: formData.printer_header_text,
    settings: formData
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Logo ve Başlık Yerleşimi</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Konumu</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, receiptTemplate_logoPosition: 'left'})}
                  className={`flex-1 flex flex-col items-center p-3 rounded-lg border ${formData.receiptTemplate_logoPosition === 'left' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <AlignLeft size={20} className="mb-1" />
                  <span className="text-xs font-medium">Sola Dayalı</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, receiptTemplate_logoPosition: 'center'})}
                  className={`flex-1 flex flex-col items-center p-3 rounded-lg border ${formData.receiptTemplate_logoPosition === 'center' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <AlignCenter size={20} className="mb-1" />
                  <span className="text-xs font-medium">Ortalı</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, receiptTemplate_logoPosition: 'right'})}
                  className={`flex-1 flex flex-col items-center p-3 rounded-lg border ${formData.receiptTemplate_logoPosition === 'right' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <AlignRight size={20} className="mb-1" />
                  <span className="text-xs font-medium">Sağa Dayalı</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, receiptTemplate_logoPosition: 'hidden'})}
                  className={`flex-1 flex flex-col items-center p-3 rounded-lg border ${formData.receiptTemplate_logoPosition === 'hidden' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <EyeOff size={20} className="mb-1" />
                  <span className="text-xs font-medium">Gizli</span>
                </button>
              </div>
            </div>

            {formData.receiptTemplate_logoPosition !== 'hidden' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo Boyutu (Maksimum Genişlik: {formData.receiptTemplate_logoSize}px)
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={formData.receiptTemplate_logoSize || 200}
                  onChange={(e) => setFormData({...formData, receiptTemplate_logoSize: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Görünürlük ve Metin</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Vergi Dairesi / VKN Göster</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.receiptTemplate_showTaxInfo}
                  onChange={(e) => setFormData({...formData, receiptTemplate_showTaxInfo: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Açık Adres Göster</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.receiptTemplate_showAddress}
                  onChange={(e) => setFormData({...formData, receiptTemplate_showAddress: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Telefon Numarası Göster</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.receiptTemplate_showPhone}
                  onChange={(e) => setFormData({...formData, receiptTemplate_showPhone: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Bilgi Metni (Footer)</label>
              <textarea
                rows={3}
                value={formData.printer_footer_text || ''}
                onChange={(e) => setFormData({...formData, printer_footer_text: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Bizi tercih ettiğiniz için teşekkür ederiz."
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold text-gray-800 mb-4">Görünüm Ayarları</h3>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Boyutu</label>
                <select
                  value={formData.receiptTemplate_fontSize || '12px'}
                  onChange={(e) => setFormData({...formData, receiptTemplate_fontSize: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="10px">Çok Küçük (10px)</option>
                  <option value="11px">Küçük (11px)</option>
                  <option value="12px">Normal (12px)</option>
                  <option value="14px">Büyük (14px)</option>
                  <option value="16px">Çok Büyük (16px)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kağıt Genişliği</label>
                <select
                  value={formData.receiptTemplate_paperWidth || '300px'}
                  onChange={(e) => setFormData({...formData, receiptTemplate_paperWidth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
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
          className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
            isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 size={20} />
              Kaydedildi
            </>
          ) : (
            <>
              <Save size={20} />
              Şablonu Kaydet
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-7 bg-gray-100 p-4 sm:p-8 rounded-xl flex flex-col items-center justify-center overflow-auto border border-gray-200 min-h-[600px] relative">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 shrink-0">Önizleme</h4>
        <iframe 
          srcDoc={previewHtml} 
          title="Fiş Önizleme"
          className="bg-white shadow-2xl border border-gray-200"
          style={{ 
            width: formData.receiptTemplate_paperWidth === '100%' ? '100%' : (formData.receiptTemplate_paperWidth || '300px'), 
            height: '600px',
            maxWidth: '100%'
          }}
        />
      </div>
    </div>
  );
};
