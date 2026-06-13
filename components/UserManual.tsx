import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  Layers, 
  Settings, 
  CreditCard, 
  Users, 
  Package, 
  ShoppingCart, 
  Warehouse, 
  FileText, 
  Wallet, 
  CalendarDays, 
  Zap, 
  Wrench, 
  BarChart3, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const UserManual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'intro' | 'hizlisatis' | 'cariler' | 'urunler' | 'siparisler' | 'efatura' | 'depo' | 'kasa_personel'>('intro');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-fade-in w-full">
      {/* Header and Quick Actions - HIDE ON PRINT */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-300" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-sans">ESİLA TİCARİ</h1>
          </div>
          <p className="text-emerald-100 text-sm md:text-base mt-2 max-w-2xl">
            Sistem kullanım kılavuzu, pratik iş akışları ve PDF dışa aktarma paneli. Aşağıdaki başlıklardan sistem detaylarını inceleyebilir veya tüm kılavuzu PDF formatında yazdırabilirsiniz.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-3 rounded-lg font-semibold shadow-sm transition-all text-sm self-start md:self-auto shrink-0 border border-emerald-100/20 active:scale-95"
        >
          <Printer size={18} />
          <span>Kılavuzu PDF Olarak Kaydet</span>
        </button>
      </div>

      {/* Screen Layout - Double column on screen, sequential on print */}
      <div className="flex flex-col lg:flex-row min-h-[600px] w-full">
        {/* Left Navigation Menu - HIDE ON PRINT */}
        <div className="w-full lg:w-72 bg-gray-50 border-r border-gray-100 p-4 no-print shrink-0">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Kılavuz Bölümleri</h2>
          <nav className="space-y-1">
            {[
              { id: 'intro', label: '1. Giriş & Genel Panel', icon: Layers },
              { id: 'hizlisatis', label: '2. Hızlı Satış (POS)', icon: Zap },
              { id: 'cariler', label: '3. Cari Hesap Yönetimi', icon: Users },
              { id: 'urunler', label: '4. Ürün & Stok Yönetimi', icon: Package },
              { id: 'siparisler', label: '5. Sipariş & Belgelendirme', icon: ShoppingCart },
              { id: 'efatura', label: '6. E-Fatura & E-Arşiv', icon: FileText },
              { id: 'depo', label: '7. Depo & Stok Sayımı', icon: Warehouse },
              { id: 'kasa_personel', label: '8. Finans, Personel & Sistem', icon: Wallet }
            ].map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeSection === section.id 
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-4 border-emerald-600 pl-2 rounded-l-none' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className={activeSection === section.id ? 'text-emerald-700' : 'text-gray-500'} />
                  {section.label}
                </button>
              );
            })}
          </nav>
          
          <div className="mt-8 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
              <HelpCircle size={14} /> Kısayol İpucu
            </h4>
            <p className="text-xs text-emerald-700/80 leading-relaxed">
              Kablolu veya kablosuz barkod okuyucunuzu bilgisayara bağladığınızda sisteme anında entegre olur. Ek ayar gerektirmez!
            </p>
          </div>
        </div>

        {/* Right Manual Content Container */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full prose max-w-none">
          {/* Print Only Header (Visible only when printed) */}
          <div className="hidden print-header print:block mb-8 pb-4 border-b-2 border-emerald-800">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-emerald-800 m-0">ESİLA TİCARİ</h1>
                <p className="text-gray-600 text-xs m-1">Kapsamlı Ticari Otomasyon, POS ve Depo Yönetim Sistemi</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm bg-emerald-50 text-emerald-800 px-3 py-1 rounded border border-emerald-200">Kullanım Kılavuzu</span>
                <p className="text-gray-500 text-[10px] mt-1">Oluşturulma: {new Date().toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>

          {/* SECTION 1: INTRODUCTION & DASHBOARD */}
          <section className={`section-block ${activeSection === 'intro' ? 'block' : 'hidden print:block'} print:break-after-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <Layers className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 1: Giriş ve Genel Kontrol Paneli (Dashboard)</h2>
            </div>
            
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              Esila Ticari, küçük ve orta ölçekli işletmelerin (KOBİ) tüm stok, cari hesap, mağaza satışı (POS), teklifler, siparişler, e-fatura entegrasyonu ve kasa süreçlerini tek bir çatı altından yöneten bulut entegrasyonlu modern bir ticari otomasyon sistemidir.
            </p>

            {/* Mock Dashboard Visual Illustration */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 print:hidden">
                <span className="font-bold text-gray-800">Görsel 1.1: Genel Yönetim Paneli</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif Oturum</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-2">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-medium">Toplam Cari</span>
                  <p className="text-lg font-bold text-emerald-800">1,248 Adet</p>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+12 Bu Hafta</span>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-medium">Stoktaki Ürünler</span>
                  <p className="text-lg font-bold text-blue-800">18,450 Adet</p>
                  <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">46 Depo Dağılımı</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-medium">Günlük Satış</span>
                  <p className="text-lg font-bold text-amber-800">₺45,750</p>
                  <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">128 Hızlı Fiş</span>
                </div>
                <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-medium">Güvenli Kasa</span>
                  <p className="text-lg font-bold text-purple-800">₺184,330</p>
                  <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">Nakit / Kart Dengeli</span>
                </div>
              </div>
              {/* Simulated Chart Container */}
              <div className="bg-white border rounded-lg p-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">Satış Analizi Hacim Grafiği</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Ortalama Kârlılık %28</span>
                </div>
                <div className="h-16 flex items-end gap-1 px-2 pt-2 bg-gradient-to-t from-gray-50 to-transparent">
                  <div className="w-full bg-emerald-200 h-8 rounded-t"></div>
                  <div className="w-full bg-emerald-400 h-11 rounded-t"></div>
                  <div className="w-full bg-emerald-300 h-9 rounded-t"></div>
                  <div className="w-full bg-emerald-500 h-14 rounded-t"></div>
                  <div className="w-full bg-emerald-600 h-12 rounded-t"></div>
                  <div className="w-full bg-teal-600 h-16 rounded-t"></div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">1.1 Temel Navigasyon ve Başlangıç</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Sisteme giriş yaptığınızda sizi karşılayan <strong>Panel</strong> sayfası şirketinizin genel finansal özetini anlık olarak gösterir.
            </p>
            <ul className="text-sm space-y-2 text-gray-600 pl-5 list-disc">
              <li><strong>Sol Menü (Navigasyon):</strong> Tüm modüllere (Hızlı Satış, Cariler, Ürünler, Depolar vb.) anında erişim sunar.</li>
              <li><strong>Üst Bar (Arama ve Profil):</strong> Hızlı arama çubuğu ve aktif kullanıcı oturum bilgilerini içerir.</li>
              <li><strong>Bildirim Kartları:</strong> Toplam ciro, bakiye, stok adedi ve işlem hacimlerini görsel grafiklerle sunar.</li>
            </ul>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 my-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900 m-0">Önemli Güvenlik İpucu</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Sistemi başka cihazlarda açık bırakmayınız. Profil menüsünden "Çıkış Yap" butonu ile oturumunuzu güvenli bir şekilde kapatabilirsiniz.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: QUICK SALES */}
          <section className={`section-block ${activeSection === 'hizlisatis' ? 'block' : 'hidden print:block'} print:break-before-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <Zap className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 2: Hızlı Satış Modülü (POS Kasa Ekranı)</h2>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              Marketler, perakende mağazaları ve hızlı fatura/fiş kesmek isteyen tüm işletmeler için tasarlanmış, klavye kısayolları ve barkod entegrasyonu tam çalışan hızlı perakende satış ekranıdır.
            </p>

            {/* Mock POS Visual Illustration */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 print:hidden">
                <span className="font-bold text-gray-800">Görsel 2.1: Hızlı Perakende POS Satış Ekranı</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Kasa Açık</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
                {/* Left product list simulation */}
                <div className="md:col-span-2 bg-white border rounded-lg p-3">
                  <div className="flex border-b pb-2 justify-between items-center text-xs font-semibold text-gray-500">
                    <span>Ürün / Adet</span>
                    <span>Toplam</span>
                  </div>
                  <div className="divide-y text-xs text-gray-700 mt-2 space-y-2">
                    <div className="flex justify-between py-1 mt-1">
                      <div>
                        <span className="font-semibold block">Wireless Kulaklık (X1)</span>
                        <span className="text-[10px] text-gray-400">₺1,250.00 / KDV %20 / İndirim %5</span>
                      </div>
                      <span className="font-bold self-center">₺1,187.50</span>
                    </div>
                    <div className="flex justify-between py-1 pt-2">
                      <div>
                        <span className="font-semibold block">Akıllı Saat Bluetooth (X2)</span>
                        <span className="text-[10px] text-gray-400">₺3,400.00 / KDV %20</span>
                      </div>
                      <span className="font-bold self-center">₺6,800.00</span>
                    </div>
                  </div>
                </div>
                {/* Right totals panel simulation */}
                <div className="bg-emerald-800 text-white border rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-emerald-300 font-bold block">Toplam Tahsilat</span>
                    <p className="text-2xl font-black mt-1">₺7,987.50</p>
                    <span className="text-[9px] text-emerald-200 block mt-2">Müşteri: Perakende / Cari Seçilmedi</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-4">
                    <div className="p-1 bg-emerald-700 text-white rounded text-center text-[9px] font-bold">Nakit (F1)</div>
                    <div className="p-1 bg-emerald-700 text-white rounded text-center text-[9px] font-bold">K. Kartı (F4)</div>
                    <div className="p-1 bg-emerald-700 text-white rounded text-center text-[9px] font-bold font-semibold">Cari (F5)</div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">2.1 Hızlı Satış Süreci</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Hızlı satışı dakikalar içinde sorunsuz yürütmek için şu 4 adımı izleyin:
            </p>
            <ol className="text-sm space-y-2 text-gray-600 pl-5 list-decimal">
              <li><strong>Ürünleri Sepete Ekleme:</strong> Barkod okutarak veya arama çubuğuna ürün adı/kodunu yazıp <kbd className="px-1 text-xs bg-gray-100 border rounded">Enter</kbd>'a basarak ürün ekleyin.</li>
              <li><strong>Miktar ve İskonto Ayarlama:</strong> Ürünlerin miktarını sepet üzerinde yer alan (+) ve (-) butonlarıyla değiştirebilir, isterseniz satır bazlı iskonto (indirim yüzdesi) girebilirsiniz.</li>
              <li><strong>Cari Seçimi (Opsiyonel):</strong> Satışı doğrudan veresiye veya carinin hesabına borç şeklinde yazmak isterseniz "Müşteri Seç" listesinden bir cari belirleyin.</li>
              <li><strong>Ödeme Yöntemi ve Bitirme:</strong> Satış tamamlandığında ödeme türünü (<strong>Nakit (F1)</strong>, <strong>Kredi Kartı (F4)</strong> veya <strong>Cari (F5)</strong>) belirleyip satışı onaylayın. Satış biter bitmez sistem otomatik olarak 80mm POS fiş çıktısını oluşturur ve yazdırır.</li>
            </ol>

            <h3 className="text-md font-semibold text-gray-700 mt-4">Satış Klavye Kısayolları (Hızlı Tuşlar):</h3>
            <div className="border rounded-lg bg-gray-50 overflow-hidden text-xs text-gray-600 my-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b">
                    <th className="p-2 border-r">Klavye Tuşu</th>
                    <th className="p-2">Yaptığı İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-2 border-r font-mono font-bold"><kbd className="px-1.5 py-0.5 bg-white border rounded">F1</kbd></td>
                    <td className="p-2">Satışı <strong>Nakit</strong> olarak tamamlar ve fişi yazdırır.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-mono font-bold"><kbd className="px-1.5 py-0.5 bg-white border rounded">F2</kbd></td>
                    <td className="p-2">Satış Arama / Barkod kutusuna odaklanır.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-mono font-bold"><kbd className="px-1.5 py-0.5 bg-white border rounded">F3</kbd></td>
                    <td className="p-2">Sepetteki ilk ürünün indirim girme kutusuna odaklanır.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-mono font-bold"><kbd className="px-1.5 py-0.5 bg-white border rounded">F4</kbd></td>
                    <td className="p-2">Satışı <strong>Kredi Kartı</strong> olarak tamamlar ve fişi yazdırır.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-mono font-bold"><kbd className="px-1.5 py-0.5 bg-white border rounded">F5</kbd></td>
                    <td className="p-2">Satışı seçtiğiniz <strong>Cari Hesaba</strong> borç kaydederek tamamlar.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 3: CUSTOMER / VENDOR MANAGEMENT */}
          <section className={`section-block ${activeSection === 'cariler' ? 'block' : 'hidden print:block'} print:break-before-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <Users className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 3: Cari Hesap Yönetimi (Müşteri & Tedarikçi)</h2>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              İşletmenizin çalıştığı tüm müşteriler (alıcılar) ve tedarikçiler (satıcılar) "Cariler" modülü altında izlenir. Her carinin borç/alacak bakiyesi, geçmiş hesap hareketleri, risk limitleri ve iletişim araçları entegre haldedir.
            </p>

            {/* Mock Cari UI Illustration */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 m-0 print:hidden">
                <span className="font-bold text-gray-800">Görsel 3.1: Cari Yönetim Paneli</span>
                <span className="text-blue-500 font-semibold font-mono">Toplam 350+ Firma</span>
              </div>
              <div className="space-y-2 text-xs mt-3">
                <div className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="font-bold text-sm block">Ufuk Bilgi Teknolojileri Ltd. Şti.</span>
                    <span className="text-[10px] text-gray-400">Şahıs / istanbul / Vergi No: 1234567890</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-red-600 block">₺45,500.00 Borçlu</span>
                    <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">Risk Limiti: ₺100K</span>
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="font-bold text-sm block">Aras Lojistik A.Ş. (Tedarikçi)</span>
                    <span className="text-[10px] text-gray-400">Tüzel / Ankara / Tedarikçi</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 block">₺12,300.00 Alacaklı</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">Güvenli</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">3.1 Cari Kart Oluşturma ve Filtreleme</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Cari hesap kartlarını oluştururken müşteri veya satıcı rolünü belirlemek, raporlamanın doğru yapılması için önemlidir.
            </p>
            <ul className="text-sm space-y-2 text-gray-600 pl-5 list-disc">
              <li><strong>Temsilci Atama (Yönetici Kontrolü):</strong> Her kariye belirli bir personel/yetkili atanabilir. Yetkili kullanıcılar giriş yaptıklarında sadece kendilerine atanmış carileri görür, diğer carileri listelemede görmezler.</li>
              <li><strong>Risk Sınırları:</strong> Carilerin açık hesap borç tavanını sınırlandıracak "Risk Limiti" belirleyin. Risk limitini aşan müşterilerde sistem sipariş anında personeli uyarır.</li>
              <li><strong>WhatsApp ve SMS Kanalları:</strong> Tek tıkla bakiye hatırlatması gönderebilmek veya carilerin numarasını kaydedip hızlıca WhatsApp entegrasyonuyla mesaj başlatmak için cari karttaki telefon numarasını doğru girmeye özen gösteriniz.</li>
            </ul>

            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 my-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-900 m-0">Toplu Excel İçe Aktarma Özelliği</h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Cariler ekranındaki "Excel'den Yükle" seçeneği ile elinizdeki tüm cari listesini tek seferde şablonunuza uydurarak sisteme aktarabilirsiniz. Şablondaki isim, unvan ve telefon alanlarının eksiksiz doldurulması tavsiye edilir.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: PRODUCTS & INVENTORY */}
          <section className={`section-block ${activeSection === 'urunler' ? 'block' : 'hidden print:block'} print:break-before-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <Package className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 4: Ürün ve Stok Yönetimi (Envanter)</h2>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              Ürünleriniz, barkodları, KDV oranları, alış ve satış fiyatları ile depo bazlı stok dağılımları "Ürünler" modülünde toplanır.
            </p>

            {/* Mock Products Visual Illustration */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 m-0 print:hidden">
                <span className="font-bold text-gray-800">Görsel 4.1: Ürün Envanter Kartları ve Barkod Üretici</span>
                <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-bold">Barkod & QR Destekli</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="bg-white border rounded-lg p-3">
                  <span className="font-bold text-xs text-gray-700 block">Stok Dağılım Grafiği (Depo Bazlı)</span>
                  <div className="space-y-2 mt-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ana Depo (Merkez)</span>
                      <span className="font-bold text-gray-800">120 Adet</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Karaköy Şube Deposu</span>
                      <span className="font-bold text-gray-800">40 Adet</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-gray-700 block">Toplu Fiyat Güncelleme</span>
                    <p className="text-[11px] text-gray-500 mt-1">Belirli bir kategori veya markadaki tüm ürünlerin fiyatlarını tek bir işlemle yüzde (%) oranında artırabilir veya genel indirim yapabilirsiniz.</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-100">Kategori: Elektronik</span>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-100">Yön: Artış (+%15)</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">4.1 Ürün Tanımlama ve Fiyatlandırma</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Ürünlerinizi girerken şu alanların doldurulması sağlıklı bir stok kontrolü sağlar:
            </p>
            <ul className="text-sm space-y-2 text-gray-600 pl-5 list-disc">
              <li><strong>Depo Stok Dağılımı:</strong> Ürünün sadece bir toplam stoğu yoktur. Ürünün hangi depoda (Örn: Merkez Depo, Şube Depo) kaç adet olduğunu ayrı ayrı tanımlayabilir ve toplam stok takibini otomatik yapabilirsiniz.</li>
              <li><strong>Toplu Fiyat Revizyon Modülü:</strong> Sezon geçişlerinde veya kur değişikliklerinde "Fiyat Revizyonu" menüsüne girerek seçilen kategori ve marka bazında tek bir tıkla fiyat artıramı (+%) veya indirim (-%) gerçekleştirebilirsiniz.</li>
              <li><strong>Toplu Barkod Üretme ve Etiket Basımı:</strong> Barkodsuz gelen mallar için sistem otomatik barkod numarası oluşturur. Ürünler sayfasından ilgili ürünleri veya tüm listeyi seçip "Toplu Barkod Yazdır" butonuna basarak 50x30mm standart etiket yazıcı formatında çıktı alabilirsiniz.</li>
            </ul>
          </section>

          {/* SECTION 5: ORDERS & SALES */}
          <section className={`section-block ${activeSection === 'siparisler' ? 'block' : 'hidden print:block'} print:break-before-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <ShoppingCart className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 5: Sipariş ve Satış Siparişi Yönetimi</h2>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              "Siparişler" modülü, toptan veya perakende kapsamda müşterilerinizden aldığınız siparişlerin aşamalı takibidir. Siparişlerin durumu tamamlandığında otomatik fatura entegrasyonu devreye girer.
            </p>

            {/* Mock Orders Visual Illustration */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 m-0 print:hidden">
                <span className="font-bold text-gray-800">Görsel 5.1: Sipariş Kartı ve Durum Akışları</span>
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold text-[10px]">Onay Bekliyor</span>
              </div>
              <div className="bg-white border rounded-lg p-3 mt-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Sipariş No: #SP-99052</span>
                    <span className="font-bold text-sm block">Ufuk Bilgi Teknolojileri</span>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full">Onay Bekliyor</span>
                </div>
                <div className="mt-3 border-t pt-2 text-[11px] text-gray-600 space-y-1">
                  <div className="flex justify-between"><span>Wireless Kulaklık (x5)</span><span className="font-semibold">₺5,937.50</span></div>
                  <div className="flex justify-between font-bold text-gray-800 pt-1 border-t"><span>Genel Toplam</span><span>₺5,937.50</span></div>
                </div>
                {/* Simulated action progress block */}
                <div className="flex justify-around items-center mt-4 pt-3 border-t text-[10px] font-bold ">
                  <div className="flex items-center gap-1 text-emerald-600"><span>✓</span> Oluşturuldu</div>
                  <div className="h-0.5 w-12 bg-emerald-300"></div>
                  <div className="flex items-center gap-1 text-yellow-600"><span>•</span> Onay Aşaması</div>
                  <div className="h-0.5 w-12 bg-gray-200"></div>
                  <div className="flex items-center gap-1 text-gray-400"><span>•</span> Faturalandır</div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">5.1 Siparişlerin Yaşam Döngüsü</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Sipariş takibi, sevkiyat doğruluğu ve finansal mutabakat açısından şu statü akışlarına sahiptir:
            </p>
            <ul className="text-sm space-y-3 text-gray-600 pl-5 list-disc">
              <li>
                <strong>Sipariş Oluşturma:</strong> Sipariş girerken cari kartı belirler, ürün ve miktarları belirlersiniz. Bu aşamada stoklar rezerve durumuna geçer.
              </li>
              <li>
                <strong>Sipariş Durumu Değiştirme (Onay):</strong> Sipariş onaylanıp <strong>"Tamamlandı"</strong> durumuna geçirildiğinde, ilgili ürünlerin miktarı otomatik olarak depodan düşer ve carinin bakiyesine alacak/borç ilişkisi yansır.
              </li>
              <li>
                <strong>Fiş / Sipariş Linki Paylaşımı:</strong> Oluşturduğunuz siparişi tek tıklamayla müşteriye benzersiz bir web bağlantısı olarak gönderebilirsiniz. Müşteriniz bu linke tıklayarak PDF kopyasına veya sipariş detayına kendi cihazından erişebilir.
              </li>
            </ul>
          </section>

          {/* SECTION 6: E-INVOICE & E-ARCHIVE */}
          <section className={`section-block ${activeSection === 'efatura' ? 'block' : 'hidden print:block'} print:break-before-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <FileText className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 6: E-Fatura ve E-Arşiv Fatura Yönetimi</h2>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              Gelir İdaresi Başkanlığı (GİB) standartlarına tam uyumlu olarak çalışan "E-Fatura" modülü; kağıt masraflarını sıfıra indiren dijital faturalandırma çözümüdür.
            </p>

            {/* Mock E-Invoice Simulation */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 m-0 print:hidden">
                <span className="font-bold text-gray-800">Görsel 6.1: E-Arşiv Fatura Görüntüleyici</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold font-mono">GİB Gönderildi</span>
              </div>
              <div className="bg-white border rounded-lg p-4 mt-3 max-w-lg mx-auto shadow-sm text-[10px]">
                <div className="flex justify-between border-b pb-2">
                  <div className="text-left font-sans">
                    <span className="font-bold block text-xs">ESİLA TİCARİ YAZILIM</span>
                    <span>Turgut Özal Bulvarı, No:45, istanbul</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-[11px] text-gray-800">E-ARŞİV FATURA</span>
                    <span>Fatura No: ESL202600000124</span>
                    <span className="block text-[8px] text-gray-400">Tarih: {new Date().toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                <div className="my-3 font-semibold text-gray-700">Sayın: Ufuk Bilgi Teknolojileri Ltd. Şti.</div>
                <div className="border border-gray-100 rounded overflow-hidden">
                  <table className="w-full text-left bg-gray-50">
                    <tr className="bg-gray-150 py-1 text-gray-600 font-bold border-b">
                      <th className="p-1">Mal/Hizmet</th>
                      <th className="p-1 text-center">Adet</th>
                      <th className="p-1 text-right">Tutar</th>
                    </tr>
                    <tr className="border-b">
                      <td className="p-1 text-gray-800">Akıllı Saat Bluetooth 5.0</td>
                      <td className="p-1 text-center">2</td>
                      <td className="p-1 text-right">₺6,800.00</td>
                    </tr>
                  </table>
                </div>
                <div className="mt-3 text-right text-xs">
                  <p className="m-0">KDV Matrahı (%20): ₺1,360.00</p>
                  <p className="font-bold text-sm text-emerald-800 m-0">Genel Toplam: ₺8,160.00</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">6.1 Entegrasyon Kurulumu ve Belge Kesimi</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              E-Fatura süreçlerini başlatmak ve GİB portalına iletmek için şu yapılandırmaları yapmalısınız:
            </p>
            <ol className="text-sm space-y-2 text-gray-600 pl-5 list-decimal">
              <li>
                <strong>Ayarlar Panelinden Entegrasyonu Açma:</strong> Sol taraftaki "Ayarlar" sayfasından "E-Fatura" sekmesine gelin. Portal Kullanıcı Adı, Portal Şifresi ve Portal API Anahtarı boşluklarını entegratörünüzden aldığınız bilgilerle doldurup kaydedin.
              </li>
              <li>
                <strong>Fatura Taslakları:</strong> Müşterilerinize kesilecek faturanın altındaki dipnot yazısını ("printer_footer_text") veya logo görselini dilediğiniz gibi tasarlayabilirsiniz.
              </li>
              <li>
                <strong>Siparişten Faturaya Hızlı Geçiş:</strong> Tamamlanan bir siparişin sağındaki "Fatura Kes" butonuna tek bir tıklama yaparak hızlıca E-Arşiv faturasını üretebilir, portal üzerinden anında GİB sunucularına gönderebilirsiniz.
              </li>
            </ol>
          </section>

          {/* SECTION 7: WAREHOUSE & STOCK TAKE */}
          <section className={`section-block ${activeSection === 'depo' ? 'block' : 'hidden print:block'} print:break-before-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <Warehouse className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 7: Depolar Arası Sevk ve Stok Sayımı</h2>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              Çoklu depolarınızdaki (Ana Depo, Mağaza Rafı, Şube Depolar vb.) stok miktarı, depolar arası ürün sevkleri ve sene sonu fiziki sayım işlemleri bu modüllerde gerçekleştirilir.
            </p>

            {/* Mock Warehouse Simulation */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 m-0 print:hidden">
                <span className="font-bold text-gray-800">Görsel 7.1: Depo Stok Transfer Detayları</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">Transfer Tamamlandı</span>
              </div>
              <div className="bg-white border rounded-lg p-3 mt-3 shadow-xs">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1 p-1 px-2 bg-emerald-50 text-emerald-800 rounded font-bold">
                    <span>Ana Depo (Çıkış)</span>
                  </div>
                  <span className="text-gray-400 font-bold">&#10142;</span>
                  <div className="flex items-center gap-1 p-1 px-2 bg-blue-50 text-blue-800 rounded font-bold">
                    <span>Karaköy Şube (Giriş)</span>
                  </div>
                </div>
                <div className="text-xs text-gray-700 mt-3 flex justify-between font-medium">
                  <span>Malzeme: Wireless Kulaklık</span>
                  <span className="font-bold">Miktar: 15 Adet</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">7.1 Stok Sayım Modülü (Fark Raporları)</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Fiziki sayımlarda kayıpları bulmak amacıyla tasarlanan <strong>Stok Sayımı</strong> süreci:
            </p>
            <ul className="text-sm space-y-2 text-gray-600 pl-5 list-disc">
              <li>Ürünlerinizin barkodunu birer birer okutarak sayılan miktarı sisteme girin.</li>
              <li>Sistem, veri tabanındaki teorik stok miktarı ile fiili olarak saydığınız miktarı mukayese eder.</li>
              <li>Aradaki eksikleri (Kaybolan mallar) veya fazlalıkları listeleyerek <strong>"Fark Raporu"</strong> çıkarır.</li>
              <li>Sayımı tamamladığınızda tek bir tıklamayla stok adetlerini "Filli Sayılan" miktara güncelleyebilirsiniz.</li>
            </ul>
          </section>

          {/* SECTION 8: CASH, STAFF, SYSTEMS */}
          <section className={`section-block ${activeSection === 'kasa_personel' ? 'block' : 'hidden print:block'} print:break-before-page`}>
            <div className="flex items-center gap-3 border-b pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg print:bg-gray-100">
                <Wallet className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 my-0">Bölüm 8: Finans, Personel İzin Yönetimi ve Yedekleme</h2>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              Kasa hareketleri, personel maaş/izin takibi, kullanıcı yetkilendirmesi ve kritik veri yedeklemelerinin yapıldığı temel yönetim bölümleridir.
            </p>

            {/* Mock Systems Visual Illustration */}
            <div className="my-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-4 print:bg-white overflow-hidden">
              <div className="bg-white border-b p-3 rounded-t-lg flex justify-between items-center text-xs text-gray-500 m-0 print:hidden">
                <span className="font-bold text-gray-800">Görsel 8.1: Rol & İzin Bazlı Yetki Yönetimi</span>
                <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-bold">Güvenli Mod</span>
              </div>
              <div className="space-y-2 mt-3 text-xs">
                <div className="bg-white border p-3 rounded-lg flex justify-between items-center">
                  <span className="font-bold">Modül: Personel İzin Yönetimi</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">Ayrı Yetkilendirilebilir</span>
                </div>
                <p className="text-[10px] text-gray-550 italic m-0 pl-1">Yönetici, personellerin her birine 'İzin Yönetimi' bölümü için okuma (view), ekleme (create) veya silme (delete) iznini modül bazlı belirler.</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6">8.1 Kasa ve Nakit Akışı Yönetimi</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Her türlü gelir ve gideleriniz (Elektrik faturası, kira ödemesi, tedarikçiye yapılan ödeme vb.) <strong>Kasa</strong> sayfasında saklanır. 
              Kasada biriken nakit ve kredi kartı bakiyelerini anlık rapor olarak alabilirsiniz.
            </p>

            <h3 className="text-lg font-bold text-gray-800 mt-6">8.2 Personel & İzin Yetkilendirme</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Personellerinizin günlük işe geliş saatlerini ve yıllık izin taleplerini takip etmek için geliştirilmiş mekanizmadır:
            </p>
            <ul className="text-sm space-y-2 text-gray-600 pl-5 list-disc">
              <li><strong>Personel İzin Yönetimi İzni:</strong> "Kullanıcılar" veya "Yetkilendirme" sekmesinden her personel için "Personel İzin Yönetimi" (izin_yonetimi) yetkisi ayrı bir satır olarak listelenir. Böylece yetkisi olmayan personeller izin talebi giremez veya diğerlerinin izinlerini onaylayamaz/düzenleyemez.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6">8.3 Veri Yedekleme ve Kurtarma</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Olası veri kayıplarının önüne geçmek için her akşam "Yedekleme & Kurtarma" sekmesinden <strong>"Tüm Veriyi İndir (.json)"</strong> butonu ile veritabanınızın yedeğini yerel cihazınıza ücretsiz kaydedebilirsiniz. Yedeğinizi geri yüklemek istediğinizde "Yedekten Geri Yükle" diyerek veritabanını o ana döndürebilirsiniz.
            </p>

            {/* Support footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center text-center">
              <span className="text-xs text-gray-400">Esila Ticari Pro Otomasyonu - © 2026</span>
              <p className="text-xs text-gray-500 m-1">Destek veya soru bildirimleriniz için sistem yöneticiniz ile irtibata geçebilirsiniz.</p>
            </div>
          </section>
        </div>
      </div>

      {/* Styled Printable Stylesheet inside the component specifically for flawless output */}
      <style>{`
        @media print {
          /* Hide app UI elements like Sidebar and Header completely */
          .no-print {
            display: none !important;
          }
          /* Remove borders, shadows, and give a paperback look */
          div {
            box-shadow: none !important;
            border: none !important;
          }
          /* Ensure all sections show sequentially on print */
          .section-block {
            display: block !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          body {
            color: #111827;
            background: #ffffff;
            font-size: 11pt;
            line-height: 1.5;
            margin: 15mm 15mm 15mm 15mm !important;
          }
          h1, h2, h3, h4 {
            color: #065f46 !important;
            page-break-after: avoid;
          }
          table {
            page-break-inside: avoid;
          }
          kbd, code {
            font-family: monospace;
            background-color: #f3f4f6 !important;
            padding: 2px 4px;
            border-radius: 3px;
          }
        }
      `}</style>
    </div>
  );
};
