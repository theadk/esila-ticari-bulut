import React, { useState, useRef, useEffect } from 'react';
import { Save, Mail, MessageSquare, Printer, Settings as SettingsIcon, Upload, X, Hash, Users, Clock, FileText, Database, Download } from 'lucide-react';
import { Settings } from '../types';
import { useAppStore } from '../lib/store';
import { UsersSettings } from '../components/UsersSettings';
import toast from 'react-hot-toast';

export const Ayarlar: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState('genel');
  const [settings, setSettings] = useState<Settings>(store.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/tenant-info', {
      headers: {
        'x-tenant-id': localStorage.getItem('esila_tenant_id') || ''
      }
    }).then(res => res.json()).then(data => setTenantInfo(data)).catch();
  }, []);

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExportBackup = () => {
    const backupData = {
      users: store.users,
      settings: store.settings,
      customers: store.customers,
      products: store.products,
      transactions: store.transactions,
      cashTransactions: store.cashTransactions,
      personnel: store.personnel,
      orders: store.orders,
      proposals: store.proposals,
      eInvoices: store.eInvoices,
      serviceTickets: store.serviceTickets,
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `esila-yedek-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Yedek başarıyla indirildi.');
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('DİKKAT: Bu işlem mevcut tüm verilerinizi silecek ve seçtiğiniz yedeği yükleyecektir. Emin misiniz?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        
        if (data.users && Array.isArray(data.users)) store.setUsers(data.users);
        if (data.settings) store.setSettings(data.settings);
        if (data.customers && Array.isArray(data.customers)) store.setCustomers(data.customers);
        if (data.products && Array.isArray(data.products)) store.setProducts(data.products);
        if (data.transactions && Array.isArray(data.transactions)) store.setTransactions(data.transactions);
        if (data.cashTransactions && Array.isArray(data.cashTransactions)) store.setCashTransactions(data.cashTransactions);
        if (data.personnel && Array.isArray(data.personnel)) store.setPersonnel(data.personnel);
        if (data.orders && Array.isArray(data.orders)) store.setOrders(data.orders);
        if (data.proposals && Array.isArray(data.proposals)) store.setProposals(data.proposals);
        if (data.eInvoices && Array.isArray(data.eInvoices)) store.setEInvoices(data.eInvoices);
        if (data.serviceTickets && Array.isArray(data.serviceTickets)) store.setServiceTickets(data.serviceTickets);
        
        toast.success('Veriler kurtarıldı. Sisteme başarıyla yedek yüklendi.');
        // Refresh page to clean UI state
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error('Geçersiz yedek dosyası.');
      }
    };
    reader.readAsText(file);
    if(event.target) event.target.value = '';
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
    { id: 'sablonlar', label: 'E-Posta Şablonları', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'yazici', label: 'Yazıcı & Çıktı', icon: Printer },
    { id: 'numaralandirma', label: 'Numaralandırma', icon: Hash },
    { id: 'kullanicilar', label: 'Kullanıcılar', icon: Users },
    { id: 'efatura', label: 'E-Fatura', icon: FileText },
    { id: 'yedekleme', label: 'Yedekleme & Kurtarma', icon: Database },
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
      <div className="flex-1 p-4 sm:p-6 md:p-4 md:p-8 overflow-y-auto">
        <div className="max-w-full sm:max-w-3xl">
          {activeTab === 'genel' && (
            <div className="space-y-6 animate-fade-in">
              {tenantInfo && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-900">Lisans Durumu</h4>
                        <p className="text-sm text-emerald-700">Lisans Bitiş Tarihi: <strong>{tenantInfo.expirationDate ? new Date(tenantInfo.expirationDate).toLocaleDateString('tr-TR') : 'Sınırsız (Ömür Boyu)'}</strong></p>
                      </div>
                    </div>
                    {tenantInfo.expirationDate && new Date(tenantInfo.expirationDate).getTime() < Date.now() + 15 * 24 * 60 * 60 * 1000 && (
                       <span className="text-red-500 font-semibold text-sm bg-red-50 px-3 py-1 rounded-full">Yakında Dolacak!</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-white border p-4 rounded-lg flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Mail size={20} /></div>
                        <div>
                           <h4 className="text-sm font-semibold text-gray-800">E-Posta Kullanımı</h4>
                           <p className="text-xs text-gray-500 mt-1">Kullanılan: <span className="font-semibold text-gray-900">{tenantInfo.emailCount || 0}</span> / {tenantInfo.emailLimit > 0 ? tenantInfo.emailLimit : 'Sınırsız'}</p>
                           {tenantInfo.emailLimit > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className={`h-1.5 rounded-full ${((tenantInfo.emailCount || 0) / tenantInfo.emailLimit) > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, ((tenantInfo.emailCount || 0) / tenantInfo.emailLimit) * 100)}%` }}></div>
                              </div>
                           )}
                        </div>
                     </div>
                     <div className="bg-white border p-4 rounded-lg flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><MessageSquare size={20} /></div>
                        <div>
                           <h4 className="text-sm font-semibold text-gray-800">SMS Kullanımı</h4>
                           <p className="text-xs text-gray-500 mt-1">Kullanılan: <span className="font-semibold text-gray-900">{tenantInfo.smsCount || 0}</span> / {tenantInfo.smsLimit > 0 ? tenantInfo.smsLimit : 'Sınırsız'}</p>
                           {tenantInfo.smsLimit > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className={`h-1.5 rounded-full ${((tenantInfo.smsCount || 0) / tenantInfo.smsLimit) > 0.8 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, ((tenantInfo.smsCount || 0) / tenantInfo.smsLimit) * 100)}%` }}></div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              )}

              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Firma Bilgileri</h3>
              <div className="grid grid-cols-1 gap-4 sm:p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yazıcı / Çıktı Logosu</label>
                  <div className="flex flex-wrap items-center gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dışa Aktarma (PDF/Fiş) Kurumsal Renk</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={settings.invoiceTemplate_color || '#10b981'}
                      onChange={(e) => handleChange('invoiceTemplate_color', e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{settings.invoiceTemplate_color || '#10b981'} (Belge tabloları ve başlıklarında kullanılır)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma Ünvanı</label>
                  <input 
                    type="text" 
                    value={settings.companyName || ''}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                    <input 
                      type="text" 
                      value={settings.taxOffice || ''}
                      onChange={(e) => handleChange('taxOffice', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Numarası (VKN/TCKN)</label>
                    <input 
                      type="text" 
                      value={settings.taxNumber || ''}
                      onChange={(e) => handleChange('taxNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı</label>
                    <input 
                      type="text" 
                      value={settings.bankName || ''}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                    <input 
                      type="text" 
                      value={settings.iban || ''}
                      onChange={(e) => handleChange('iban', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea 
                    rows={3}
                    value={settings.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input 
                      type="text" 
                      value={settings.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                    <input 
                      type="email" 
                      value={settings.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="sm:px-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yazdırılacak Barkod Türü</label>
                  <select
                    value={settings.barcode_type || '1D'}
                    onChange={(e) => handleChange('barcode_type', e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="1D">1D (Çizgi Barkod - Code128)</option>
                    <option value="QR">QR Kod</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Ürün detaylarında "Barkod Yazdır" denildiğinde üretilecek formatı belirler.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eposta' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">E-Posta Sunucu Ayarları</h3>
              <div className="grid grid-cols-1 gap-4 sm:p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input 
                    type="text" 
                    value={settings.smtp_host || ''}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input 
                    type="text" 
                    value={settings.smtp_port || ''}
                    onChange={(e) => handleChange('smtp_port', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    value={settings.smtp_user || ''}
                    onChange={(e) => handleChange('smtp_user', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input 
                    type="password" 
                    value={settings.smtp_pass || ''}
                    onChange={(e) => handleChange('smtp_pass', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-md font-medium text-gray-800 mb-2">Mail Sınama</h4>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      id="testEmailAddress"
                      placeholder="Sınama maili alacak e-posta"
                      defaultValue={settings.email || ""}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 flex-1"
                    />
                    <button 
                      type="button"
                      onClick={async () => {
                         const email = (document.getElementById('testEmailAddress') as HTMLInputElement).value;
                         if (!email) {
                           toast.error("Lütfen bir e-posta adresi girin.");
                           return;
                         }
                         
                         const promise = fetch('/api/test-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                         }).then(async res => {
                            if (!res.ok) throw new Error();
                            return res.json();
                         });

                         toast.promise(promise, {
                            loading: 'Sınama maili gönderiliyor...',
                            success: 'Sınama maili başarıyla gönderildi.',
                            error: 'Mail gönderimi başarısız oldu. Lütfen ayarları kontrol edin.'
                         });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Test Maili Gönder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sablonlar' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                 <h3 className="text-xl font-semibold text-gray-800">E-Posta Şablonları</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Gönderilen maillerin tasarımlarını (HTML formatında) buradan özelleştirebilirsiniz. Desteklenen değişkenleri kopyalayarak html içerisine yapıştırabilirsiniz. 
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cari Ekstre */}
                <div className="col-span-1 border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col h-full">
                  <h4 className="font-semibold text-gray-800 mb-2">Cari Ekstre Şablonu</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['{MUSTERI_ADI}', '{BAKIYE}', '{FIRMA_ADI}', '{TARIH}'].map(variable => (
                      <span key={variable} className="bg-white border text-xs px-2 py-1 rounded cursor-copy hover:bg-gray-100" onClick={() => navigator.clipboard.writeText(variable)} title="Kopyala">{variable}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-2 border-b pb-2">
                    <button type="button" className="text-sm font-medium text-emerald-600 hover:underline" onClick={() => {
                      if(!settings.email_template_customer) {
                        handleChange('email_template_customer', `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">\n  <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">\n    <h2 style="margin: 0;">Cari Hesap Ekstresi</h2>\n  </div>\n  <div style="padding: 20px; color: #374151;">\n    <p>Sayın <strong>{MUSTERI_ADI}</strong>,</p>\n    <p>Gelişen ticari ilişkilerimizin devamını dileriz. <strong>{TARIH}</strong> tarihi itibarıyla cari hesabınızın güncel borç/alacak bakiyesi aşağıda belirtilmiştir.</p>\n    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">\n      <p style="margin: 0; font-size: 14px; text-transform: uppercase;">Güncel Bakiye</p>\n      <h3 style="margin: 5px 0 0 0; font-size: 24px; color: #047857;">{BAKIYE}</h3>\n    </div>\n    <p>Detaylı dökümü ekteki belgede bulabilirsiniz.</p>\n    <p style="margin-top: 30px;">Saygılarımızla,<br/><strong>{FIRMA_ADI}</strong></p>\n  </div>\n</div>`);
                      }
                    }}>Varsayılan Şablonu Yükle</button>
                  </div>
                  <textarea 
                    rows={10}
                    className="w-full flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm mb-4"
                    value={settings.email_template_customer || ''}
                    onChange={(e) => handleChange('email_template_customer', e.target.value)}
                    placeholder="<div style='font-family: Arial...'>"
                  ></textarea>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Önizleme</h5>
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white overflow-y-auto max-h-[300px]"
                      dangerouslySetInnerHTML={{ __html: (settings.email_template_customer || 'Görünüm Seçilen HTML\'e Göre Buraya Gelecek')
                        .replace('{MUSTERI_ADI}', 'Ahmet Yılmaz')
                        .replace('{BAKIYE}', '1.250,00 TL')
                        .replace('{FIRMA_ADI}', settings.companyName || 'Örnek Firma Ltd.')
                        .replace('{TARIH}', new Date().toLocaleDateString('tr-TR'))
                      }}
                    />
                  </div>
                </div>

                {/* Mutabakat */}
                <div className="col-span-1 border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col h-full">
                  <h4 className="font-semibold text-gray-800 mb-2">Mutabakat Şablonu</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['{MUSTERI_ADI}', '{BAKIYE}', '{BAKIYE_TIPI}', '{TARIH}', '{FIRMA_ADI}'].map(variable => (
                      <span key={variable} className="bg-white border text-xs px-2 py-1 rounded cursor-copy hover:bg-gray-100" onClick={() => navigator.clipboard.writeText(variable)} title="Kopyala">{variable}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-2 border-b pb-2">
                    <button type="button" className="text-sm font-medium text-blue-600 hover:underline" onClick={() => {
                      if(!settings.email_template_reconciliation) {
                        handleChange('email_template_reconciliation', `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">\n  <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">\n    <h2 style="margin: 0;">Mutabakat Mektubu</h2>\n  </div>\n  <div style="padding: 20px; color: #374151;">\n    <p>Sayın <strong>{MUSTERI_ADI}</strong> Yetkilisi,</p>\n    <p>Şirketimiz kayıtlarına göre <strong>{TARIH}</strong> tarihi itibariyle cari hesabınız aşağıdaki gibidir:</p>\n    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">\n      <tr><td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold; background-color: #f9fafb;">Bakiye:</td><td style="border: 1px solid #e5e7eb; padding: 10px; color: #1d4ed8; font-weight:bold; font-size:18px;">{BAKIYE}</td></tr>\n      <tr><td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold; background-color: #f9fafb;">Bakiye Tipi:</td><td style="border: 1px solid #e5e7eb; padding: 10px;">{BAKIYE_TIPI}</td></tr>\n    </table>\n    <p>Bakiyenin mutabık olduğunu veya olmadığını tarafımıza dönüş yaparak bildirmenizi rica ederiz.</p>\n    <p style="margin-top: 30px;">Saygılarımızla,<br/><strong>{FIRMA_ADI}</strong></p>\n  </div>\n</div>`);
                      }
                    }}>Varsayılan Şablonu Yükle</button>
                  </div>
                  <textarea 
                    rows={10}
                    className="w-full flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm mb-4"
                    value={settings.email_template_reconciliation || ''}
                    onChange={(e) => handleChange('email_template_reconciliation', e.target.value)}
                    placeholder="<div style='font-family: Arial...'>"
                  ></textarea>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Önizleme</h5>
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white overflow-y-auto max-h-[300px]"
                      dangerouslySetInnerHTML={{ __html: (settings.email_template_reconciliation || 'Görünüm Seçilen HTML\'e Göre Buraya Gelecek')
                        .replace('{MUSTERI_ADI}', 'Mehmet Demir')
                        .replace('{BAKIYE}', '5.400,00 TL')
                        .replace('{BAKIYE_TIPI}', 'Borç Bakiye')
                        .replace('{FIRMA_ADI}', settings.companyName || 'Örnek Firma Ltd.')
                        .replace('{TARIH}', new Date().toLocaleDateString('tr-TR'))
                      }}
                    />
                  </div>
                </div>

                {/* Personel */}
                <div className="col-span-1 lg:col-span-2 border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col h-full">
                  <h4 className="font-semibold text-gray-800 mb-2">Personel Bordro Şablonu</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['{PERSONEL_ADI}', '{AY_YIL}', '{NET_ODENEN}', '{FIRMA_ADI}'].map(variable => (
                      <span key={variable} className="bg-white border text-xs px-2 py-1 rounded cursor-copy hover:bg-gray-100" onClick={() => navigator.clipboard.writeText(variable)} title="Kopyala">{variable}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-2 border-b pb-2">
                    <button type="button" className="text-sm font-medium text-rose-600 hover:underline" onClick={() => {
                      if(!settings.email_template_personnel) {
                        handleChange('email_template_personnel', `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">\n  <div style="background-color: #e11d48; color: white; padding: 20px; text-align: center;">\n    <h2 style="margin: 0;">Maaş Bordrosu</h2>\n  </div>\n  <div style="padding: 20px; color: #374151;">\n    <p>Sayın <strong>{PERSONEL_ADI}</strong>,</p>\n    <p><strong>{AY_YIL}</strong> dönemine ait maaş bordro dökümünüz oluşturulmuştur.</p>\n    <div style="background-color: #fff1f2; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; border: 1px solid #fecdd3;">\n      <p style="margin: 0; font-size: 14px; text-transform: uppercase;">Net Ödenen Tutar</p>\n      <h3 style="margin: 5px 0 0 0; font-size: 24px; color: #be123c;">{NET_ODENEN}</h3>\n    </div>\n    <p>Şirketimize olan değerli katkılarınızdan dolayı teşekkür ederiz. Detaylı dökümü ekteki dosyada bulabilirsiniz.</p>\n    <p style="margin-top: 30px;">İnsan Kaynakları & Muhasebe<br/><strong>{FIRMA_ADI}</strong></p>\n  </div>\n</div>`);
                      }
                    }}>Varsayılan Şablonu Yükle</button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                    <textarea 
                      rows={10}
                      className="w-full h-full min-h-[250px] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 font-mono text-sm"
                      value={settings.email_template_personnel || ''}
                      onChange={(e) => handleChange('email_template_personnel', e.target.value)}
                      placeholder="<div style='font-family: Arial...'>"
                    ></textarea>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Önizleme</h5>
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white overflow-y-auto h-full max-h-[300px]"
                        dangerouslySetInnerHTML={{ __html: (settings.email_template_personnel || 'Görünüm Seçilen HTML\'e Göre Buraya Gelecek')
                          .replace('{PERSONEL_ADI}', 'Ayşe Türk')
                          .replace('{AY_YIL}', 'Haziran 2026')
                          .replace('{NET_ODENEN}', '45.000,00 TL')
                          .replace('{FIRMA_ADI}', settings.companyName || 'Örnek Firma Ltd.')
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">SMS Ayarları (TopluSMSAPI / iletiMerkezi)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-100">
                <div className="md:col-span-2 mb-2">
                  <p className="text-sm text-gray-600">
                    <a href="https://www.toplusmsapi.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">toplusmsapi.com</a> alt yapısını kullanarak SMS gönderimi yapabilirsiniz. API erişim bilgilerinizi panelden alarak aşağıya girin.
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gönderici Başlığı (Originator)</label>
                  <input 
                    type="text"
                    maxLength={11}
                    value={settings.sms_sender_id || ''}
                    onChange={(e) => handleChange('sms_sender_id', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    placeholder="Gönderici başlığı"
                  />
                  <p className="text-xs text-gray-500 mt-1">Onaylanmış SMS gönderici başlığınız (Maks. 11 karakter).</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Public Key (API Anahtarı)</label>
                  <input 
                    type="text" 
                    value={settings.sms_api_key || ''}
                    onChange={(e) => handleChange('sms_api_key', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    placeholder="API anahtarınızı girin"
                  />
                  <p className="text-xs text-gray-500 mt-1">toplusmsapi.com panelinden alacağınız Public Key</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Private Key (API Hash)</label>
                  <input 
                    type="password" 
                    value={settings.sms_api_hash || ''}
                    onChange={(e) => handleChange('sms_api_hash', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    placeholder="API gizli anahtarınızı girin"
                  />
                  <p className="text-xs text-gray-500 mt-1">toplusmsapi.com panelinden alacağınız Private Key / Hash</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'yazici' && (
            <div className="animate-fade-in flex flex-col lg:flex-row gap-4 md:p-8">
              <div className="flex-1 space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Makbuz & Çıktı Tasarımı</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Makbuz Başlığı</label>
                  <input 
                    type="text" 
                    value={settings.printer_header_text || ''}
                    onChange={(e) => handleChange('printer_header_text', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Makbuz Alt Bilgisi</label>
                  <textarea 
                     rows={3}
                     value={settings.printer_footer_text || ''}
                     onChange={(e) => handleChange('printer_footer_text', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="pt-4 text-sm text-gray-500">
                  <p>Not: Logoyu 'Genel' sekmesinden yükleyebilirsiniz. Yüklenen logo sadece çıktı belgelerinde (makbuz, fatura vb.) kullanılacaktır.</p>
                </div>
              </div>
              <div className="w-full lg:w-[320px] bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-b pb-2 mb-4">Önizleme (80mm Fiş)</h4>
                <div className="bg-white border p-4 shadow-sm w-full mx-auto" style={{ maxWidth: '280px' }}>
                  <div className="text-center mb-4">
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                    ) : (
                      <h2 className="font-logo text-4xl mb-2 text-black">{settings.printer_header_text || 'esila'}</h2>
                    )}
                    <p className="text-xs font-medium">{settings.companyName || 'Firma Ünvanı'}</p>
                    <p className="text-xs text-gray-500 whitespace-pre-line">{settings.address?.substring(0, 30)}...</p>
                    <p className="text-xs text-gray-500">{settings.phone}</p>
                    {settings.taxOffice && settings.taxNumber && (
                      <p className="text-xs text-gray-500 mt-1">{settings.taxOffice} - VKN: {settings.taxNumber}</p>
                    )}
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
                    <p className="whitespace-pre-line">{settings.printer_footer_text || 'Alt bilgi buraya gelecek...'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'numaralandirma' && (
            <div className="space-y-6 animate-fade-in md:p-8">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Evrak & Kayıt Numaralandırma Şablonları</h3>
              <p className="text-sm text-gray-600 mb-6">Yeni oluşturulacak kayıtlarda otomatik olarak atanacak ön ekleri ve numara başlangıçlarını belirleyebilirsiniz.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Cari Şablonu */}
                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Cari Kart Numarası</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Ön Ek</label>
                      <input 
                        type="text" 
                        value={settings.prefix_customer || 'CAR'}
                        onChange={(e) => handleChange('prefix_customer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Sıradaki No</label>
                      <input 
                        type="number" 
                        value={settings.next_customer_id || 1001}
                        onChange={(e) => handleChange('next_customer_id', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 text-gray-500 text-right">Örnek Sonuç: <strong className="text-gray-800">{(settings.prefix_customer || 'CAR')}-{(settings.next_customer_id || 1001)}</strong></div>
                </div>

                {/* Sipariş Şablonu */}
                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div>Sipariş Numarası</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Ön Ek</label>
                      <input 
                        type="text" 
                        value={settings.prefix_order || 'SIP'}
                        onChange={(e) => handleChange('prefix_order', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Sıradaki No</label>
                      <input 
                        type="number" 
                        value={settings.next_order_id || 1001}
                        onChange={(e) => handleChange('next_order_id', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 text-gray-500 text-right">Örnek Sonuç: <strong className="text-gray-800">{(settings.prefix_order || 'SIP')}-{(settings.next_order_id || 1001)}</strong></div>
                </div>

                {/* Teklif Şablonu */}
                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Teklif Numarası</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Ön Ek</label>
                      <input 
                        type="text" 
                        value={settings.prefix_offer || 'TEK'}
                        onChange={(e) => handleChange('prefix_offer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Sıradaki No</label>
                      <input 
                        type="number" 
                        value={settings.next_offer_id || 1001}
                        onChange={(e) => handleChange('next_offer_id', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 text-gray-500 text-right">Örnek Sonuç: <strong className="text-gray-800">{(settings.prefix_offer || 'TEK')}-{(settings.next_offer_id || 1001)}</strong></div>
                </div>

                {/* Ürün Kodu Şablonu */}
                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Ürün / Stok Kodu</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Ön Ek</label>
                      <input 
                        type="text" 
                        value={settings.prefix_product || 'URN'}
                        onChange={(e) => handleChange('prefix_product', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Sıradaki No</label>
                      <input 
                        type="number" 
                        value={settings.next_product_id || 1001}
                        onChange={(e) => handleChange('next_product_id', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 text-gray-500 text-right">Örnek Sonuç: <strong className="text-gray-800">{(settings.prefix_product || 'URN')}-{(settings.next_product_id || 1001)}</strong></div>
                </div>

                {/* Personel Numarası Şablonu */}
                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Personel Sicil Numarası</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Ön Ek</label>
                      <input 
                        type="text" 
                        value={settings.prefix_personnel || 'PER'}
                        onChange={(e) => handleChange('prefix_personnel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Sıradaki No</label>
                      <input 
                        type="number" 
                        value={settings.next_personnel_id || 1001}
                        onChange={(e) => handleChange('next_personnel_id', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 text-gray-500 text-right">Örnek Sonuç: <strong className="text-gray-800">{(settings.prefix_personnel || 'PER')}-{(settings.next_personnel_id || 1001)}</strong></div>
                </div>

                {/* E-Fatura Şablonu */}
                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500"></div>E-Fatura Numarası</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Ön Ek (3 Haneli)</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        value={settings.prefix_efatura || 'FAT'}
                        onChange={(e) => handleChange('prefix_efatura', e.target.value.toUpperCase().slice(0, 3))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Sıradaki No</label>
                      <input 
                        type="number" 
                        value={settings.next_efatura_id || 1}
                        onChange={(e) => handleChange('next_efatura_id', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 text-gray-500 text-right">Örnek Sonuç: <strong className="text-gray-800">{(settings.prefix_efatura || 'FAT').padEnd(3, 'A').slice(0, 3)}{new Date().getFullYear()}{String(settings.next_efatura_id || 1).padStart(9, '0')}</strong></div>
                </div>

                {/* E-Arşiv Şablonu */}
                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div>E-Arşiv Numarası</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Ön Ek (3 Haneli)</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        value={settings.prefix_earsiv || 'ARS'}
                        onChange={(e) => handleChange('prefix_earsiv', e.target.value.toUpperCase().slice(0, 3))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">Sıradaki No</label>
                      <input 
                        type="number" 
                        value={settings.next_earsiv_id || 1}
                        onChange={(e) => handleChange('next_earsiv_id', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 text-gray-500 text-right">Örnek Sonuç: <strong className="text-gray-800">{(settings.prefix_earsiv || 'ARS').padEnd(3, 'A').slice(0, 3)}{new Date().getFullYear()}{String(settings.next_earsiv_id || 1).padStart(9, '0')}</strong></div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'kullanicilar' && <UsersSettings />}

          {activeTab === 'efatura' && (
            <div className="space-y-6 animate-fade-in md:p-8">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">E-Fatura Entegrasyon Ayarları</h3>
              <p className="text-sm text-gray-600 mb-6">Esila E-Dönüşüm entegratör veya GİB portalı bağlantı ayarlarınız. Kayıt olmak için www.e-esial.com</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    value={settings.efatura_username || ''}
                    onChange={(e) => handleChange('efatura_username', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Esila Portal Kullanıcı Adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input 
                    type="password" 
                    value={settings.efatura_password || ''}
                    onChange={(e) => handleChange('efatura_password', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Portal Şifresi"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Anahtarı (API Key)</label>
                  <input 
                    type="text" 
                    value={settings.efatura_apikey || ''}
                    onChange={(e) => handleChange('efatura_apikey', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Entegratör API Key"
                  />
                  <p className="mt-1 text-xs text-gray-500">Esila E-Fatura API üzerinden belge gönderimi için entegratörünüzden alacağınız API şifresi veya anahtarı.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'yedekleme' && (
            <div className="space-y-6 animate-fade-in md:p-8">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Veri Yedekleme ve Kurtarma</h3>
              <p className="text-sm text-gray-600 mb-6">Uygulama çökmelerinde veya veri kayıplarında kullanılmak üzere sisteminizin yedeğini alabilir veya mevcut yedeğinizi geri yükleyebilirsiniz.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                <div className="border rounded-xl p-6 bg-blue-50/50">
                  <div className="flex items-center gap-3 mb-4 text-blue-800">
                    <Database size={24} />
                    <h4 className="font-semibold text-lg">Yedek Al</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">Sistemdeki tüm müşteriler, ürünler, faturalar, teklifler ve kasa hareketlerini JSON formatında bilgisayarınıza indirir.</p>
                  <button 
                    onClick={handleExportBackup}
                    className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Download size={18} />
                    <span>Tüm Veriyi İndir (.json)</span>
                  </button>
                </div>

                <div className="border rounded-xl p-6 bg-rose-50/50">
                  <div className="flex items-center gap-3 mb-4 text-rose-800">
                    <Upload size={24} />
                    <h4 className="font-semibold text-lg">Veri Kurtar (Yedek Yükle)</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">Daha önce indirdiğiniz yedek dosyasını yükleyerek sistemi o anki duruma geri döndürebilirsiniz. <strong className="text-red-600">Bu işlem geri alınamaz!</strong></p>
                  
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    id="import-backup" 
                    onChange={handleImportBackup} 
                  />
                  <label 
                    htmlFor="import-backup"
                    className="w-full justify-center bg-rose-600 hover:bg-rose-700 cursor-pointer text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Upload size={18} />
                    <span>Yedekten Geri Yükle</span>
                  </label>
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