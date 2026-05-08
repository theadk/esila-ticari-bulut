import React, { useState } from 'react';
import { Save, Globe, Mail, MessageSquare, Printer, Settings as SettingsIcon } from 'lucide-react';
import { Settings } from '../types';

const INITIAL_SETTINGS: Settings = {
  companyName: 'Esila Örnek Şirket Ltd. Şti.',
  address: 'Örnek Mah. Atatürk Cad. No:1, İstanbul',
  phone: '0850 123 45 67',
  email: 'info@esila.com',
  marketplace_trendyol_api: '****************',
  marketplace_hepsiburada_api: '****************',
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: 'bildirim@esila.com',
  sms_token: 'A1B2-C3D4-E5F6',
  printer_header_text: 'Esila Ticari',
  printer_footer_text: 'Bizi tercih ettiğiniz için teşekkürler!'
};

export const Ayarlar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('genel');
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'genel', label: 'Genel', icon: SettingsIcon },
    { id: 'pazaryeri', label: 'Pazar Yerleri', icon: Globe },
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

          {activeTab === 'pazaryeri' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Pazar Yeri Entegrasyonları</h3>
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                Bu API anahtarları ürünlerinizi Trendyol ve Hepsiburada ile senkronize etmek için kullanılır.
              </div>
              <div className="space-y-6">
                <div className="border p-4 rounded-xl">
                  <h4 className="font-semibold text-orange-600 mb-4">Trendyol Entegrasyonu</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input 
                      type="password" 
                      value={settings.marketplace_trendyol_api}
                      onChange={(e) => handleChange('marketplace_trendyol_api', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="border p-4 rounded-xl">
                   <h4 className="font-semibold text-orange-500 mb-4">Hepsiburada Entegrasyonu</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                    <input 
                      type="password" 
                      value={settings.marketplace_hepsiburada_api}
                      onChange={(e) => handleChange('marketplace_hepsiburada_api', e.target.value)}
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
            <div className="space-y-6 animate-fade-in">
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
            </div>
          )}

          <div className="pt-6 mt-6 border-t flex justify-end">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
              <Save size={18} />
              <span>Ayarları Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};