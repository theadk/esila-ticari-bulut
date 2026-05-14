import React, { useState, useRef } from 'react';
import { Save, Mail, MessageSquare, Printer, Settings as SettingsIcon, Upload, X } from 'lucide-react';
import { Settings } from '../types';
import { useAppStore } from '../lib/store';

export const Ayarlar: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState('genel');
  const [settings, setSettings] = useState<Settings>(store.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    store.setSettings(settings);
    alert('Ayarlar kaydedildi.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleChange('companyLogo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'genel', label: 'Genel', icon: SettingsIcon },
    { id: 'eposta', label: 'E-Posta (SMTP)', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'yazici', label: 'Yazıcı & Çıktı', icon: Printer },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col md:flex-row overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4">
        <h3 className="font-bold text-gray-700 mb-4 px-2">Yapılandırma</h3>
        <ul className="space-y-1">
          {tabs.map((tab) => {
             const Icon = tab.icon;
             return (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              </li>
             );
          })}
        </ul>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-3xl">
          {activeTab === 'genel' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Firma Bilgileri</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma Logosu</label>
                  <div className="flex items-center gap-4">
                    {settings.companyLogo ? (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                        <button 
                          onClick={() => handleChange('companyLogo', '')}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100 text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-emerald-500 transition-colors"
                      >
                        <Upload size={24} className="mb-2" />
                        <span className="text-xs">Logo Yükle</span>
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLogoUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <div className="text-sm text-gray-500">
                      <p>Önerilen boyut: 250x100px</p>
                      <p>Maksimum dosya boyutu: 1MB (Sadece PNG, JPG, WEBP)</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma Ünvanı</label>
                  <input 
                    type="text" 
                    value={settings.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea 
                    rows={3}
                    value={settings.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input 
                      type="text" 
                      value={settings.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                    <input 
                      type="email" 
                      value={settings.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eposta' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">E-Posta Sunucu Ayarları</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input 
                    type="text" 
                    value={settings.smtp_host}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input 
                    type="text" 
                    value={settings.smtp_port}
                    onChange={(e) => handleChange('smtp_port', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    value={settings.smtp_user}
                    onChange={(e) => handleChange('smtp_user', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">SMS Ayarları</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMS Sağlayıcı Token</label>
                <input 
                  type="password" 
                  value={settings.sms_token}
                  onChange={(e) => handleChange('sms_token', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-2">API anahtarınızı SMS sağlayıcı panelinden alabilirsiniz.</p>
              </div>
            </div>
          )}

          {activeTab === 'yazici' && (
            <div className="animate-fade-in flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Makbuz & Çıktı Tasarımı</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Makbuz Başlığı</label>
                  <input 
                    type="text" 
                    value={settings.printer_header_text}
                    onChange={(e) => handleChange('printer_header_text', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Makbuz Alt Bilgisi</label>
                  <textarea 
                     rows={3}
                    value={settings.printer_footer_text}
                    onChange={(e) => handleChange('printer_footer_text', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="pt-4 text-sm text-gray-500">
                  <p>Not: Logoyu 'Genel' sekmesinden değiştirebilirsiniz. Yüklenen logo çıktı belgelerinde de kullanılacaktır.</p>
                </div>
              </div>
              <div className="w-full lg:w-[320px] bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-b pb-2 mb-4">Önizleme (80mm Fiş)</h4>
                <div className="bg-white border p-4 shadow-sm w-full mx-auto" style={{ maxWidth: '280px' }}>
                  {settings.companyLogo && (
                    <div className="mb-3 flex justify-center">
                      <img src={settings.companyLogo} alt="Logo" className="max-h-12 object-contain" />
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <h2 className="font-bold text-lg mb-1">{settings.printer_header_text || 'Firma Başlığı'}</h2>
                    <p className="text-xs text-gray-500">{settings.address?.substring(0, 30)}...</p>
                    <p className="text-xs text-gray-500">{settings.phone}</p>
                  </div>
                  
                  <div className="border-t border-dashed border-gray-300 py-3 mb-3 text-sm">
                    <div className="flex justify-between font-bold mb-1">
                      <span>Örnek Ürün</span>
                      <span>150.00 TL</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 x 150.00 TL</span>
                      <span>KDV %20</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-dashed border-gray-300 pt-3 text-right">
                    <div className="font-bold text-lg">TOPLAM: 150.00 TL</div>
                  </div>
                  
                  <div className="mt-6 text-center text-xs italic text-gray-600">
                    <p>{settings.printer_footer_text || 'Alt bilgi buraya gelecek...'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 mt-6 border-t flex justify-end">
            <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
              <Save size={18} />
              <span>Ayarları Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};