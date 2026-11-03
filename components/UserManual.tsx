import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Warehouse, 
  Wallet, 
  UserCheck, 
  FileText, 
  Settings as SettingsIcon,
  FileBadge,
  Handshake,
  Zap,
  Wrench,
  CalendarDays,
  ScanLine,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Search,
  DollarSign,
  ShoppingBag,
  Factory,
  Landmark,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Mic
} from 'lucide-react';

export const UserManual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'hizlisatis'
    | 'terminal'
    | 'cariler'
    | 'crm'
    | 'urunler'
    | 'siparisler'
    | 'satinalma'
    | 'uretim'
    | 'efatura'
    | 'depo'
    | 'sayim'
    | 'kasa'
    | 'ceksenet'
    | 'dokumanlar'
    | 'personel'
    | 'mutabakat'
    | 'ariza'
    | 'ajanda'
    | 'raporlar'
    | 'teklif'
    | 'ayarlar'
    | 'sesliasistan'
    | 'lisansodeme'
  >('dashboard');

  const [searchTerm, setSearchTerm] = useState('');

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const sectionsList = [
    { id: 'dashboard', label: '1. Panel (Dashboard)', icon: LayoutDashboard },
    { id: 'hizlisatis', label: '2. Hızlı Satış (POS)', icon: Zap },
    { id: 'terminal', label: '3. El Terminali & Mobil Barkod', icon: ScanLine },
    { id: 'cariler', label: '4. Cari Yönetimi', icon: Users },
    { id: 'crm', label: '5. CRM & Kampanya', icon: Users },
    { id: 'urunler', label: '6. Ürün Envanteri (Stok)', icon: Package },
    { id: 'siparisler', label: '7. Sipariş Yönetimi', icon: ShoppingCart },
    { id: 'satinalma', label: '8. Satın Alma Yönetimi', icon: ShoppingBag },
    { id: 'uretim', label: '9. Üretim & Reçete (BOM)', icon: Factory },
    { id: 'efatura', label: '10. E-Fatura & Termal E-Arşiv', icon: FileText },
    { id: 'depo', label: '11. Çoklu Depo & Sevk', icon: Warehouse },
    { id: 'sayim', label: '12. Stok Sayım & Denetim', icon: ScanLine },
    { id: 'kasa', label: '13. Kasa & Gider Yönetimi', icon: Wallet },
    { id: 'ceksenet', label: '14. Çek & Senet Takibi', icon: DollarSign },
    { id: 'dokumanlar', label: '15. Döküman Yönetimi', icon: BookOpen },
    { id: 'personel', label: '16. Personel, Puantaj & İzin', icon: UserCheck },
    { id: 'mutabakat', label: '17. Cari Mutabakat (Dijital)', icon: Handshake },
    { id: 'ariza', label: '18. Arıza & Teknik Servis', icon: Wrench },
    { id: 'ajanda', label: '19. Ajanda & Hatırlatıcı', icon: CalendarDays },
    { id: 'raporlar', label: '20. Finansal Raporlar & Nakit Akışı', icon: TrendingUp },
    { id: 'teklif', label: '21. Teklif & Bulut Onay', icon: FileBadge },
    { id: 'ayarlar', label: '22. Ayarlar, DB İzleme & Yedekleme', icon: SettingsIcon },
    { id: 'sesliasistan', label: '23. Sesli Asistan & Komut Paleti', icon: Mic },
    { id: 'lisansodeme', label: '24. Lisans & Havale/EFT Bildirimi', icon: Landmark },
  ];

  const filteredSections = sectionsList.filter((s) =>
    s.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="printable-user-manual" className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-fade-in w-full text-gray-800 print-target">
      {/* Header and Quick Actions - HIDE ON PRINT */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print border-b border-emerald-900/35">
        <div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-300" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-sans">ESİLA TİCARİ MODÜLER KULLANIM REHBERİ</h1>
          </div>
          <p className="text-emerald-100 text-sm md:text-base mt-2 max-w-2xl">
            Sistem içindeki tüm <strong>24 ana modülün</strong> güncel çalışma prensipleri, yeni eklenen operasyonel özellikler, görsel arayüz simülasyonları ve kurumsal iş akışları aşağıda detaylı olarak listelenmiştir.
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
      <div className="flex flex-col lg:flex-row min-h-[750px] w-full">
        {/* Left Navigation Menu - HIDE ON PRINT */}
        <div className="w-full lg:w-80 bg-gray-50 border-r border-gray-100 p-4 no-print shrink-0">
          <div className="mb-3 px-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Modül veya konu ara..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Modül Rehberi ({sectionsList.length})</h2>
          <nav className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    activeSection === section.id 
                      ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 pl-2 rounded-l-none' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} className={activeSection === section.id ? 'text-emerald-700' : 'text-gray-450'} />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-150 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
              <HelpCircle size={13} /> PDF Baskı İpucu
            </h4>
            <div className="text-[11px] text-emerald-700/90 leading-relaxed space-y-1">
              <p>Mükemmel A4 mizanpajı için:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Baskı Hedefi: <strong>PDF Olarak Kaydet</strong></li>
                <li><strong>Arka Plan Grafikleri</strong> seçeneğini açın.</li>
                <li>Kenar Boşlukları: <strong>Varsayılan / Minimum</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Manual Content Container */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto w-full prose max-w-none bg-white">
          {/* Print Only Header (Visible only when printed) */}
          <div className="hidden print-header print:block mb-8 pb-4 border-b-2 border-emerald-800">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-extrabold text-emerald-800 m-0">ESİLA TİCARİ ERP</h1>
                <p className="text-gray-600 text-xs m-1">Kapsamlı Bulut Entegre Ticari Otomasyon ve Kurumsal Kaynak Yönetimi Kılavuzu (v4.5 Güncel Sürüm)</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded border border-emerald-200 uppercase">Resmi Modüler El Kitabı</span>
                <p className="text-gray-500 text-[9px] mt-1 m-0">Baskı Zamanı: {new Date().toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 1. PANEL (DASHBOARD) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'dashboard' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">1. Genel Analiz ve Yönetim Paneli (Dashboard)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Yönetici Paneli, firmanızın anlık finansal özetini, kritik seviyedeki stok uyarılarını, günlük ciro grafiklerini, sistem bağlantı durumunu ve bekleyen iş listelerini tek bir ekranda toplayan konsolide izleme merkezidir.
            </p>

            {/* Portal Visual Mockup: Dashboard */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-900 text-slate-100 shadow-md p-4 overflow-hidden">
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-850 pb-2 mb-4">
                <span className="font-bold tracking-wider uppercase text-emerald-400">ESİLA CLOUD PORTAL // PANEL</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Canlı İzleme Aktif</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Tüm Alacak Cari</span>
                  <p className="text-base font-bold text-emerald-400 m-0 mt-0.5">₺2,481,250</p>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-4/5"></div>
                  </div>
                </div>
                <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Toplam Borç Cari</span>
                  <p className="text-base font-bold text-rose-450 m-0 mt-0.5">₺940,300</p>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-rose-450 h-full w-2/5"></div>
                  </div>
                </div>
                <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Günlük Kasa Ciro</span>
                  <p className="text-base font-bold text-amber-400 m-0 mt-0.5">₺120,550</p>
                  <span className="text-[8px] bg-amber-400/10 text-amber-300 px-1 py-0.2 rounded-full mt-1.5 inline-block">74 Slip Fiş</span>
                </div>
                <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Kritik Stok</span>
                  <p className="text-base font-bold text-blue-400 m-0 mt-0.5">18 Kritik Kalem</p>
                  <span className="text-[8px] bg-blue-400/10 text-blue-300 px-1 py-0.2 rounded-full mt-1.5 inline-block">Hızlı Sipariş Aç</span>
                </div>
              </div>

              {/* Weekly Chart Simulation */}
              <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 text-[10px]">
                <p className="font-semibold text-slate-350 mb-2">Haftalık Satış Hacim Grafiği (KDV Dahil / Matrah)</p>
                <div className="flex items-end gap-2.5 h-16 pt-2">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-emerald-500/80 rounded-t h-5"></div>
                    <span className="text-[8px] text-slate-500 mt-1">Pzt</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-emerald-500/80 rounded-t h-8"></div>
                    <span className="text-[8px] text-slate-500 mt-1">Sal</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-emerald-500/80 rounded-t h-12"></div>
                    <span className="text-[8px] text-slate-500 mt-1">Çar</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-emerald-500/80 rounded-t h-6"></div>
                    <span className="text-[8px] text-slate-500 mt-1">Per</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-emerald-500 rounded-t h-14"></div>
                    <span className="text-[8px] text-slate-500 mt-1">Cum</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center flex-grow-0">
                    <div className="w-6 bg-amber-500 rounded-t h-16"></div>
                    <span className="text-[8px] text-slate-400 mt-1 font-bold">Cts</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">1.1 Temel Kullanım Prensipleri</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Anlık Finansal Takip:</strong> Sayfayı her açtığınızda veritabanından en güncel satış, alış, kasa ve cari bakiyeleri anında derlenir. Bilgiler dinamiktir.</li>
              <li><strong>Kritik Seviye Mal Alarmları:</strong> Tanımladığınız asgari stok limitinin altına düşen malzemeler otomatik algılanarak satın alma sorumlularına uyarı olarak listelenir.</li>
              <li><strong>Özelleştirilebilir Widget Düzeni:</strong> Panel üzerindeki finansal özet kartlarını ve hızlı işlem kısayollarını sürükle-bırak mimarisiyle çalışma alışkanlığınıza göre sıralayabilirsiniz.</li>
              <li><strong>Canlı Sistem & Veritabanı Durumu:</strong> Üst bilgi çubuğundaki durum göstergesi üzerinden sunucu ve veritabanı sağlığını anlık izleyebilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 2. HIZLI SATIŞ (POS) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'hizlisatis' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Zap className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">2. Hızlı Satış Modülü (Perakende POS Kasa & Müşteri Ekranı)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Barkod okuyucular, dokunmatik POS ekranlar, ikinci ekran (Customer Display) desteği ve hızlı fiş yazıcılar ile anlık perakende satışı sağlayan; kasiyerlerin işlem hızını maksimize eden pratik satış ekranıdır.
            </p>

            {/* Portal Visual Mockup: Hizli Satis */}
            <div className="my-6 border border-emerald-950/20 rounded-xl bg-slate-900 text-slate-100 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[10px]">
                <span className="font-bold text-emerald-400 uppercase tracking-widest">KASA TERMİNAL // POS-1</span>
                <span className="font-mono bg-slate-800 text-slate-350 px-2 py-0.5 rounded">Kasiyer: Ahmet D. | Müşteri Ekranı: Aktif</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 flex items-center justify-between">
                      <span className="text-slate-500">8699123456789 (Barkod Taratın veya Yazın...)</span>
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-bold">EKLE</button>
                  </div>

                  {/* Cart Table */}
                  <div className="space-y-1.5 mt-2 max-h-[140px] overflow-y-auto">
                    <div className="bg-slate-900 p-2 rounded flex justify-between items-center text-[11px] border-l-2 border-emerald-500">
                      <div>
                        <p className="font-bold text-slate-200">Esila Pro Kablosuz Mouse</p>
                        <p className="text-[9px] text-slate-500">Adet: 2 // KDV: %20</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-200">₺1,200.00</p>
                        <p className="text-[9px] text-rose-400 font-semibold">%5 İskonto</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded flex justify-between items-center text-[11px] border-l-2 border-emerald-500">
                      <div>
                        <p className="font-bold text-slate-200">USB Type-C Hub 6in1</p>
                        <p className="text-[9px] text-slate-500">Adet: 1 // KDV: %20</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-200">₺450.00</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Pay Column */}
                <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 flex flex-col justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Tahsil Edilecek Toplam</span>
                    <h4 className="text-xl font-mono font-extrabold text-emerald-400 my-1">₺1,590.00</h4>
                    
                    <div className="space-y-1 mt-2 text-[10px]">
                      <div className="flex justify-between text-slate-400"><span>Ara Toplam:</span><span>₺1,325.00</span></div>
                      <div className="flex justify-between text-slate-400"><span>KDV Toplamı:</span><span>₺265.00</span></div>
                      <div className="flex justify-between text-slate-400"><span>Net İskonto:</span><span className="text-rose-400">-₺60.00</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 mt-3">
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1.5 text-center text-[9px] font-bold">F1 NAKİT</button>
                    <button className="bg-blue-600 hover:bg-blue-750 text-white rounded p-1.5 text-center text-[9px] font-bold">F4 K.KARTI</button>
                    <button className="bg-amber-600 hover:bg-amber-700 text-white rounded p-1.5 text-center text-[9px] font-bold">F5 VERESİYE</button>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">2.1 Hızlı Satış, Barkod, Müşteri Ekranı ve Mobil Kamera Entegrasyonu</h3>
            <ul className="text-sm space-y-2 text-gray-700 pl-5 list-disc">
              <li><strong>Tak-Çalıştır Barkod Okuyucu:</strong> USB veya kablosuz barkod tabancası ile okutulan barkod doğrudan ürünü sepete ekler ve imleci bir sonraki okutmaya hazır tutar.</li>
              <li><strong>Çift Ekran (Müşteri Bilgi Ekranı / Customer Display):</strong> Kasa arkasında müşteriye dönük ikinci monitörde sepetteki ürünler, ara toplam, kampanya görselleri ve para üstü bilgisi gerçek zamanlı gösterilir.</li>
              <li><strong>Fiyat Gör & Bekleyen Sepet (Park):</strong> Kasada sıra bekleyen müşterileri bekletmemek için mevcut sepeti "Beklemeye Al" ile park edebilir, yeni müşterinin satışını tamamlayıp bekleyen sepete geri dönebilirsiniz.</li>
            </ul>
            <p className="text-sm text-gray-700 leading-relaxed mt-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-150">
              <strong>Mobil Cihaz ve Telefon Kamerası ile Tarama:</strong> Saha satışlarında veya el terminallerinin bulunmadığı durumlarda, kasiyerler veya satış personeli doğrudan akıllı telefon veya tablet kameralarını kullanarak barkod okutabilir. Ekrandaki kamera ikonuna basıldığında tarayıcı kamera katmanı açılır ve cihazın kamerasını barkoda tutarak saniyeler içerisinde ürünü tanır ve sepete atar.
            </p>
            <h3 className="text-base font-bold text-gray-800 mt-4">2.2 Klavye Kısayolları</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F1</span> <span className="font-semibold text-emerald-800">Nakit Satış</span></div>
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F2</span> Barkod Odakla</div>
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F4</span> <span className="font-semibold text-blue-800">Kredi Kartı</span></div>
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F5</span> <span className="font-semibold text-amber-800">Cariye Veresiye</span></div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 3. EL TERMİNALİ */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'terminal' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <ScanLine className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">3. El Terminali ve Mobil Saha Barkod Operasyonları</h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Depo içerisindeki mal kabul, raf adresleme, sevk toplama, fiyat sorgulama ve anlık stok sayım süreçlerini endüstriyel Android el terminalleri veya cep telefonları üzerinden hatasız gerçekleştirmenizi sağlayan modüldür.
            </p>
            <h3 className="text-base font-bold text-gray-800 mt-4">3.1 El Terminali İşlevleri</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Hızlı Barkod & Fiyat Kontrolü:</strong> Reyon veya depoda barkodu okutulan ürünün güncel satış fiyatı, KDV oranı ve hangi depoda kaç adet bulunduğu anında ekrana gelir.</li>
              <li><strong>Mal Kabul & İrsaliye Doğrulama:</strong> Tedarikçiden gelen kolilerin barkodları okutularak sipariş edilen miktar ile fiili teslim alınan miktar karşılaştırılır.</li>
              <li><strong>Sipariş Toplama (Picking):</strong> Müşteri siparişlerindeki ürünlerin depo raflarından doğru adet ve barkodla toplanmasını sağlayarak yanlış ürün gönderimini sıfıra indirir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 4. CARİ YÖNETİMİ (CARİLER) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'cariler' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">4. Cari Kart Yönetimi (Müşteri & Tedarikçi Finans Defteri)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşteri ve alıcı firmalar ile mal aldığınız tedarikçi (toptancı) hesaplarının borç/alacak bakiyelerini, vadelendirmelerini, taksit planlarını, yasal fatura kimliklerini ve risk sınırlarını organize eden ana modüldür.
            </p>

            {/* Portal Visual Mockup: Cariler */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Sanal Ekran: Cari Bilgi Kartı Paneli</span>
                <span className="text-gray-400">Filtrele: Akıllı Cari Arama</span>
              </div>
              <div className="bg-white border rounded-lg p-3 shadow-xs space-y-3 prose max-w-full text-xs">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b pb-2">
                  <div>
                    <h4 className="font-bold text-gray-800 m-0">Ufuk Bilgi Teknolojileri San. Tic. Ltd. Şti.</h4>
                    <span className="text-[10px] bg-emerald-150 text-emerald-800 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">Tüzel Cari // Müşteri-Alıcı</span>
                  </div>
                  <div className="text-right">
                    <p className="m-0 text-gray-400 text-[10px]">Net Cari Hesap Durumu</p>
                    <p className="m-0 text-sm font-extrabold text-emerald-800">₺142,500.00 Borçlu</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-relaxed">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
                    <span className="font-semibold block text-gray-505 uppercase text-[9px]">Fatura Bilgileri</span>
                    <p className="m-0 mt-1">VD: Kadıköy Dairesi // No: 9870123456</p>
                    <p className="m-0">Adres: Osmanağa Mh. Söğütlüçeşme Cd. No:44 İstanbul</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
                    <span className="font-semibold block text-gray-505 uppercase text-[9px]">Temsilci & Risk Limiti</span>
                    <p className="m-0 mt-1">Sorumlu Personel: <strong>Kadir Can Yılmaz</strong></p>
                    <p className="m-0 text-rose-750">Maksimum Risk Sınırı: ₺200,000.00</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
                    <span className="font-semibold block text-gray-505 uppercase text-[9px]">İletişim & Onay</span>
                    <p className="m-0 mt-1">E-Posta: info@ufukbt.com</p>
                    <p className="m-0">GSM: +90 (532) 123 4567</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">4.1 Granüler Saha Satış Temsilcisi Sınırlaması</h3>
            <p className="text-sm text-gray-700">
              Bu sistemin en kritik kurumsal yeteneği <strong>Müşteri Temsilcisi Atama</strong> altyapısıdır. Şahıs/Tüzel cari açılırken kartın altından bir personel "Satış Temsilcisi" tayin edildiğinde:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li>Eğer sisteme giriş yapan kullanıcı "admin" değilse, yalnızca <strong>kendisinin sorumlu olduğu carileri</strong> listeleyebilir.</li>
              <li>Diğer satışçıların carilerini, onların bakiyelerini veya telefon numaralarını göremez ve değiştiremez.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">4.2 Cari Hesap Hareket Detayları (Cari Ekstre) ve Taksit Takibi</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc mt-1">
              <li>Her faturanın, tahsilat makbuzunun, tediye fişinin, iade faturasının ve taksit ödemesinin tarihi, evrak numarası, işlem türü ve borç/alacak tutarları net olarak tablo halinde listelenir.</li>
              <li>Seçili tarih aralıklarına göre cari hesap ekstresi süzülebilir, PDF/yazıcı çıktısı alınabilir veya doğrudan müşteriye WhatsApp, SMS ya da E-Posta ile gönderilebilir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 5. CRM & KAMPANYA */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'crm' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">5. CRM, Müşteri İlişkileri & Kampanya Yönetimi</h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Potansiyel müşteri adaylarını (Lead), satış fırsatlarını, müşteri görüşme notlarını takip ettiğiniz ve hedef kitlelere toplu SMS, E-Posta veya WhatsApp kampanyaları düzenleyerek satışlarınızı artırmanızı sağlayan modüldür.
            </p>
            <h3 className="text-base font-bold text-gray-800 mt-4">5.1 Fırsat Pipeline ve Kampanya Özellikleri</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Aday ve Fırsat Yönetimi:</strong> Henüz cari kartı açılmamış potansiyel müşterilerle yapılan telefon/saha görüşmelerini kaydedebilir, "İlk Görüşme", "Teklif Verildi", "Müzakere", "Kazanıldı" aşamalarıyla takip edebilirsiniz.</li>
              <li><strong>Hedefli Kampanya Kurgusu:</strong> Belirli bir şehirdeki, belirli bir ciro üzerindeki veya uzun süredir alım yapmayan müşterileri filtreleyerek özel indirim kampanyaları ve duyurular gönderebilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 6. ÜRÜN ENVANTERİ (ÜRÜNLER) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'urunler' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">6. Ürün Envanter Kaydı (Stok, Barkod & Toplu İşlemler)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizin alıp sattığı tüm emtiayı, ticari malları veya hizmet çeşitlerini; barkod, KDV sınıfı, alış/satış fiyatı, tedarik maliyetleri ve kategorileriyle saklayan merkezi stok kütüphanesidir.
            </p>

            {/* Portal Visual Mockup: Ürünler */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Sanal Ekran: Envanter Detay Kartı & Toplu İşlem Çubuğu</span>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1"><Trash2 size={10} /> Seçilenleri Sil Aktif</span>
              </div>
              
              <div className="bg-white border rounded-lg p-3 text-xs space-y-3">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <h4 className="font-bold text-gray-800 m-0">Esila Pro Kablosuz Mouse V4</h4>
                    <span className="text-[10px] text-gray-400">Ürün Barkodu: 8699123456789 (EAN-13)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black border border-blue-150">Toplam Stok: 240 Adet</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-gray-450 block uppercase">Alış Fiyatı</span>
                    <strong className="text-gray-800 text-xs text-center font-mono">₺650.00</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-gray-450 block uppercase">Önerilen Satış</span>
                    <strong className="text-emerald-800 text-xs text-center font-mono">₺1,200.00</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-gray-450 block uppercase">Vergi Sınıfı</span>
                    <strong className="text-gray-800 text-xs text-center font-mono">%20 KDV</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-gray-450 block uppercase">Kritik Limit</span>
                    <strong className="text-rose-600 text-xs text-center font-bold">15 Adet</strong>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4 font-sans">6.1 Toplu Seçim, Seçilenleri Sil, Fiyat Güncelleme ve Barkod Özellikleri</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Çoklu Ürün Seçimi ve "Seçilenleri Sil" Özelliği:</strong> Ürün listesinin solundaki onay kutularını (checkbox) kullanarak tek tek veya sayfadaki tüm ürünleri seçebilir; üst barda beliren <strong>"Seçilenleri Sil"</strong> butonu ve güvenlik onay penceresi ile birden fazla ürünü veritabanından kalıcı ve güvenli şekilde temizleyebilirsiniz.</li>
              <li><strong>Toplu Fiyat Revizyon Sihirbazı:</strong> Maliyet değişimlerinde belirli bir kategori veya seçili ürünler bazında toplu olarak alış/satış fiyatlarına yüzdesel artış/indirim (+/-%) veya sabit tutar uygulayabilirsiniz.</li>
              <li><strong>Toplu Barkod Etiket Şablonu:</strong> Seçili ürünlerden istediğiniz adetlerde <strong>termal sticker barkod etiketleri</strong> oluşturarak etiket yazıcılarından çıktı alabilirsiniz.</li>
              <li><strong>Excel İle Toplu Ürün Aktarımı:</strong> Binlerce ürünü Excel şablonu üzerinden tek seferde içeri aktarabilir veya mevcut stok listenizi dışa aktarabilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 7. SİPARİŞ YÖNETİMİ (SİPARİŞLER) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'siparisler' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">7. Sipariş Yönetim Modülü (Alış, Satış & Geçmiş Sipariş Filtreleme)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşterilerinizden toplanan satış siparişleri ile tedarikçi firmalara geçtiğiniz satınalma siparişlerini, lojistik sevk aşamalarını ve geçmiş sipariş arşivini koordine eden ticari akış motorudur.
            </p>

            {/* Portal Visual Mockup: Siparişler */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-850">Sipariş İşlem Safhası Simülatörü</span>
                <span className="font-medium">No: ES-2026-613</span>
              </div>

              <div className="flex justify-between items-center max-w-lg mx-auto py-3 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-emerald-200 -translate-y-1/2 -z-10"></div>
                <div className="flex flex-col items-center bg-white border border-emerald-200 p-1.5 rounded-full z-10 w-8 h-8 justify-center shadow-xs"><CheckCircle2 className="text-emerald-600 w-4 h-4" /></div>
                <div className="flex flex-col items-center bg-white border border-emerald-200 p-1.5 rounded-full z-10 w-8 h-8 justify-center shadow-xs"><CheckCircle2 className="text-emerald-600 w-4 h-4" /></div>
                <div className="flex flex-col items-center bg-emerald-600 border border-emerald-500 p-1.5 rounded-full z-10 w-8 h-8 justify-center text-white shadow-xs"><strong className="text-[10px]">3</strong></div>
                <div className="flex flex-col items-center bg-white border border-gray-200 p-1.5 rounded-full z-10 w-8 h-8 justify-center shadow-xs text-gray-400"><strong className="text-[10px]">4</strong></div>
              </div>
              <div className="grid grid-cols-4 text-[9px] font-bold text-gray-500 text-center max-w-lg mx-auto mt-1">
                <span className="text-emerald-800">Oluşturuldu</span>
                <span className="text-emerald-800">Hazırlanıyor</span>
                <span className="text-emerald-600 font-extrabold">Sevk Edildi</span>
                <span>Tamamlandı</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">7.1 Siparişte Rezerve Stok, Kısmi Sevk ve Tamamlama Mantığı</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Sipariş statüsü <strong>Oluşturuldu / Hazırlanıyor</strong> durumunda iken eklediğiniz ürünlerin adetleri fiziksel stoktan kalıcı olarak düşülmez; ancak sistemde o siparişe adanmış olarak <strong>rezerve</strong> edilir. Sipariş <strong>Tamamlandı</strong> statüsüne geçirildiğinde:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li>Müşteri cari hesabına borç (veya alış siparişinde tedarikçi alacak) otomatik işlenir.</li>
              <li>Rezerve edilen stok adetleri ilgili depodan kalıcı olarak düşer ve envanter defteri resmiyet kazanır.</li>
              <li><strong>Gelişmiş Geçmiş Sipariş Filtreleme:</strong> Tarih aralığı, sipariş durumu (Bekleyen, Sevk Edilen, Tamamlanan, İptal), sipariş türü (Alınan/Verilen) ve cari unvanına göre geçmiş siparişleri detaylı süzebilir, Excel/PDF raporu alabilirsiniz.</li>
              <li>Tek tıkla siparişten <strong>E-Fatura / E-Arşiv Fatura</strong> oluşturabilir veya sevkiyat fişi yazdırabilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 8. SATIN ALMA */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'satinalma' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">8. Satın Alma ve Tedarik Zinciri Yönetimi</h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Kurum içi departmanlardan gelen satın alma taleplerini onay süreçleriyle yönetebileceğiniz, tedarikçilerden alınan fiyat tekliflerini karşılaştırıp en uygun teklifi satın alma siparişine ve alış faturasına dönüştürebileceğiniz otomasyondur.
            </p>
            <h3 className="text-base font-bold text-gray-800 mt-4">8.1 Satın Alma Akışı</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Kritik Stoktan Otomatik Talep:</strong> Kritik stok seviyesinin altına düşen ürünler için tek tıkla satın alma talep fişi oluşturulur.</li>
              <li><strong>Tedarikçi Teklif Mukayesesi:</strong> Aynı malzeme için farklı toptancılardan alınan birim fiyat, vade ve teslim süresi koşulları yan yana karşılaştırılır.</li>
              <li><strong>Mal Kabul ve Maliyet Güncelleme:</strong> Onaylanan satın alma siparişi depoya ulaştığında stoklar otomatik artar ve ürünlerin son alış maliyetleri güncellenir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 9. ÜRETİM */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'uretim' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Factory className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">9. Üretim Yönetimi (Ürün Reçeteleri / BOM & İş Emirleri)</h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Hammadde ve yarı mamullerinizi ürün reçeteleri (BOM - Bill of Materials) altında tanımlayarak üretim iş emirleri oluşturabileceğiniz, fire oranlarını ve birim üretim maliyetlerini takip edebileceğiniz ileri seviye üretim modülüdür.
            </p>
            <h3 className="text-base font-bold text-gray-800 mt-4">9.1 Reçete ve Üretim Tamamlama Prensibi</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Ürün Reçetesi (BOM) Tanımı:</strong> 1 adet nihai mamul üretmek için hangi hammaddeden kaç birim/gram/metre kullanılacağı ve işçilik/enerji ek maliyetleri reçeteye tanımlanır.</li>
              <li><strong>Otomatik Hammadde Sarfiyatı ve Mamul Girişi:</strong> Üretim iş emri "Tamamlandı" durumuna getirildiğinde, reçetedeki hammaddeler ilgili depodan otomatik düşülür ve üretilen nihai ürün stoğa otomatik eklenir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 10. E-FATURA & E-ARŞİV (EFATURA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'efatura' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">10. Esila E-Fatura, E-Arşiv ve Termal E-Arşiv Portalı</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Resmi standartlarda, kağıt fatura kesim ihtiyacını ortadan kaldırarak saniyeler içinde kurumsal E-Fatura, E-Arşiv Fatura veya 80mm yazar kasa uyumlu <strong>Termal E-Arşiv Fatura</strong> üreten, taslak fatura yönetimini destekleyen entegrasyon altyapısıdır.
            </p>

            {/* Portal Visual Mockup: EFatura */}
            <div className="my-6 border border-emerald-800/10 rounded-xl bg-slate-100 p-4">
              <div className="bg-white border rounded-lg p-3 shadow-sm max-w-md mx-auto text-xs">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <span className="font-bold text-slate-800 text-[10px] uppercase">Esila E-Fatura Gönderme Arabirimi</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 rounded font-bold">Esila API Bağlantısı Aktif</span>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-slate-50 p-2 rounded border text-[10px] space-y-1">
                    <p className="m-0 text-gray-450 uppercase text-[8px] font-bold">Müşteri VKN/TCKN Sorgulama</p>
                    <p className="m-0 font-bold text-gray-700">3412345678 (Ufuk Bilgi Teknolojileri)</p>
                    <p className="m-0 text-emerald-700">✓ Esila Mükellef Kontrolü: Bu vergi numarası E-Fatura Mükellefidir!</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-gray-450 block text-[8px] uppercase">Fatura Ön Eki</span>
                      <strong className="text-gray-800 font-mono">ESL2026</strong>
                    </div>
                    <div className="bg-slate-55 p-2 rounded">
                      <span className="text-gray-450 block text-[8px] uppercase">Seçili Şablon</span>
                      <strong className="text-gray-800">Esila Özel Şablon V4</strong>
                    </div>
                  </div>

                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded text-center text-[10px] font-bold shadow-xs">
                    ETTN KODU ÜRET & ESILA ENTEGRATÖR HAVUZUNA GÖNDER
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">10.1 Akıllı Mükellef Sorgulama, Taslak Kayıt ve Termal E-Arşiv</h3>
            <ul className="text-sm space-y-2 text-gray-700 pl-5 list-disc">
              <li><strong>Mükellef Otomatik Algılama:</strong> Müşteriye ait VKN veya TCKN sorgulandığında alıcının E-Fatura mükellefi olup olmadığı otomatik denetlenir; mükellef ise E-Fatura, değilse E-Arşiv Fatura senaryosu seçilir.</li>
              <li><strong>Taslak E-Fatura Yönetimi:</strong> Faturayı resmileştirmeden önce <strong>Taslak</strong> olarak kaydedebilir, sonradan kalemlerini, para birimini veya dipnotlarını düzenleyip onaylayabilirsiniz.</li>
              <li><strong>Termal E-Arşiv (80mm POS Yazıcı):</strong> Perakende ve saha satışlarında A4 yazıcıya ihtiyaç duymadan, karekodlu (QR) resmi E-Arşiv faturanızı 80mm termal fiş yazıcısından anında basabilirsiniz.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">10.2 Gelen Faturaların Otomatik Cari ve Ürün Eşleştirmesi</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc mt-1.5">
              <li><strong>Otomatik Cari Kaydı:</strong> Gelen faturayı kesen firma sisteminizde kayıtlı değilse, XML dosyasındaki VKN, Unvan ve Adres bilgilerini ayrıştırarak yeni bir <strong>Tedarikçi Cari Kartı</strong> açar.</li>
              <li><strong>Otomatik Ürün Eşleştirme ve Stok Girişi:</strong> Gelen faturadaki ürün kalemlerini envanterinizle eşleştirerek stoğunu artırır; sistemde olmayan ürünleri otomatik olarak yeni ürün kartı olarak tanımlar.</li>
              <li><strong>Otomatik Ödeme Hatırlatıcı Takvimi:</strong> Faturanın vade tarihini ayrıştırarak <strong>Ajanda</strong> modülüne otomatik ödeme hatırlatması ekler.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 11. ÇOKLU DEPO & SEVK (DEPO) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'depo' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Warehouse className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-855 my-0">11. Çoklu Depo Yönetimi & Depolar Arası Sevk (Transfer)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizin şubeleri, merkez ambarı veya araç depoları arasındaki güncel stok dağılımını izleyen ve kontrollü ürün transferini sağlayan lokasyon bazlı envanter modülüdür.
            </p>

            {/* Portal Visual Mockup: Depo */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Depolar Arası Sevk Formu Simülasyonu</span>
                <span className="text-xs bg-emerald-50 text-emerald-805 px-2 rounded">Onay Durumu: Sevk Edildi</span>
              </div>

              <div className="bg-white border rounded-lg p-3 text-xs space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-gray-400 block text-[9px] uppercase">Çıkış Kaynak Deposu</span>
                    <strong className="text-gray-800 text-[11px]">Merkez Lojistik Deposu</strong>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded">
                    <span className="text-emerald-700/80 block text-[9px] uppercase">Giriş Hedef Deposu</span>
                    <strong className="text-emerald-800 text-[11px]">Kadıköy Şube Deposu</strong>
                  </div>
                </div>

                <div className="border border-slate-100 rounded text-[10px]">
                  <div className="bg-slate-50 p-1.5 font-bold border-b flex justify-between">
                    <span>Sevk Edilen Malzeme</span>
                    <span>Gönderilen Adet</span>
                  </div>
                  <div className="p-2 flex justify-between border-b">
                    <span>Esila Pro Kablosuz Mouse</span>
                    <strong className="font-mono text-emerald-850">40 Adet</strong>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span>USB Type-C Hub 6in1</span>
                    <strong className="font-mono text-emerald-850">15 Adet</strong>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">11.1 Çoklu Depo Çalışma Akışı</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Her ürünün tanımlanan her deponun gözünde ayrı stok miktarları tutulur. Şubeler veya depolar arası ürün gönderirken <strong>Depolar Arası Sevk Fişi</strong> kullanılır. Fiş onaylandığında kaynak depodaki stok miktarı azalırken hedef depodaki stok miktarı otomatik olarak artar ve sevk irsaliyesi basılabilir.
            </p>
          </section>

          {/* ========================================================= */}
          {/* 12. STOK SAYIM & DENETİM (SAYIM) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'sayim' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <ScanLine className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-855 my-0">12. Stok Sayımı ve Fiili Envanter Sapma Denetimi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Fiziki raftaki gerçek mal sayıları ile bilgisayardaki teorik stok durumunu mukayese eden, aradaki fark raporlarını üreterek stok kaçaklarını saptayan denetim modülüdür.
            </p>

            {/* Portal Visual Mockup: Sayim */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Sanal Ekran: Sayım Defteri Fark Raporu</span>
                <span className="text-rose-600 bg-rose-50 px-2 rounded-full font-bold">Sayım Farkı Tespit Edildi</span>
              </div>

              <div className="overflow-x-auto text-[10px]">
                <table className="w-full text-left bg-white border divide-y divide-gray-150">
                  <thead className="bg-slate-100 font-bold text-gray-700">
                    <tr>
                      <th className="p-2">Malzeme Adı</th>
                      <th className="p-2">Sistem Stoğu</th>
                      <th className="p-2">Sayılan (Fiili)</th>
                      <th className="p-2">Fark / Sapma</th>
                      <th className="p-2">Finans Fark Fişi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-650">
                    <tr>
                      <td className="p-2 font-medium">Esila Pro Kablosuz Mouse</td>
                      <td className="p-2 font-mono">152 Adet</td>
                      <td className="p-2 font-mono">150 Adet</td>
                      <td className="p-2 font-bold text-red-650 font-mono">-2 Adet (Eksik)</td>
                      <td className="p-2"><span className="bg-rose-100 text-rose-800 px-1 py-0.2 rounded text-[7px] font-bold">Stok Gideri</span></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">USB Type-C Hub 6in1</td>
                      <td className="p-2 font-mono">45 Adet</td>
                      <td className="p-2 font-mono">46 Adet</td>
                      <td className="p-2 font-bold text-emerald-650 font-mono">+1 Adet (Fazla)</td>
                      <td className="p-2"><span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded text-[7px] font-bold">Stok Geliri</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">12.1 Sayım Onaylama ve Mobil Kamera ile Sayım</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Mağaza personeli el terminali veya cep telefonu kamerası ile rafları taratıp sayılan adeti sisteme girdiğinde, sistem anlık olarak karşılaştırma raporu üretir. Yönetici <strong>Sayımı Onayla ve Stoğu Güncelle</strong> butonuna bastığı an bilgisayardaki stoklar otomatik olarak fiili sayılan gerçek sayılara eşitlenir.
            </p>
          </section>

          {/* ========================================================= */}
          {/* 13. KASA & NAKİT AKIŞI (KASA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'kasa' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Wallet className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">13. Finansal Kasa, Banka POS ve Genel Gider Yönetimi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizin sıcak para girdi ve çıktılarını takip eden Nakit, Kredi Kartı POS ve Banka hesaplarını; personel yol/yemek, kira, fatura gibi şirket genel giderlerini kayıt altına alan merkezdir.
            </p>

            {/* Portal Visual Mockup: Kasa */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Sanal Ekran: Kasa Dağılım Paneli</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 rounded-full font-bold">Giriş/Çıkış Raporu</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                <div className="bg-white border p-3 rounded-lg shadow-xs">
                  <span className="text-gray-450 text-[9px] block uppercase font-medium">Merkez Nakit Kasası</span>
                  <p className="m-0 text-md font-extrabold text-slate-800 font-mono mt-1">₺145,200.00</p>
                  <span className="text-[8px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded-full font-semibold mt-1 inline-block">Sıcak Para Faal</span>
                </div>
                <div className="bg-white border p-3 rounded-lg shadow-xs">
                  <span className="text-gray-450 text-[9px] block uppercase font-medium">Şube POS (Kredi Kartı)</span>
                  <p className="m-0 text-md font-extrabold text-blue-700 font-mono mt-1">₺101,750.00</p>
                  <span className="text-[8px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded-full font-semibold mt-1 inline-block">Banka Entegrasyon</span>
                </div>
                <div className="bg-white border p-3 rounded-lg shadow-xs">
                  <span className="text-gray-450 text-[9px] block uppercase font-medium">Son Aylık Genel Gider</span>
                  <p className="m-0 text-md font-extrabold text-rose-700 font-mono mt-1">₺34,900.00</p>
                  <span className="text-[8px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded-full font-semibold mt-1 inline-block">Elektrik, Kira, Yakıt</span>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">13.1 Günlük Kasa Kapatma ve Gider Tasnifi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Her akşam gün sonu alınırken fiziki çekmecedeki nakit para ile sistemdeki "Nakit Kasası" bakiyesi mutabık kılınır. Gider kaydederken kategori seçilmesi, Raporlar modülündeki <strong>Nakit Akışı</strong> ve <strong>Kar/Zarar</strong> analizlerine doğrudan yansır.
            </p>
          </section>

          {/* ========================================================= */}
          {/* 14. ÇEK & SENET TAKİBİ */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'ceksenet' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <DollarSign className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">14. Çek & Senet Portföy Takibi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Alınan ve verilen çeklerin/senetlerin vade, portföy durumu, ciro, banka tahsilat ve karşılıksız/protesto gibi aşamalarını dijital olarak yönetebileceğiniz finansal evrak takip merkezidir.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">14.1 Portföy & Ciro İşlemleri</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc mt-1.5">
              <li>Müşterilerden tahsilat olarak alınan çekler sistemde "Portföyde" durumunda saklanır ve cari bakiyeden düşülür.</li>
              <li>Portföydeki müşteri çeklerini ödeme olarak tedarikçinize ciro edebilir, tek tıkla "Ciro Edildi" konumuna güncelleyebilirsiniz.</li>
              <li>Kendi firmanıza ait keşide ettiğiniz çek ve senetlerin yaklaşan vadelerini takip ederek nakit akışınızı planlayabilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 15. DÖKÜMAN YÖNETİMİ */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'dokumanlar' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">15. Kurumsal Döküman ve Dijital Arşiv Yönetimi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Fatura, teklif, irsaliye, sözleşme, imza sirküleri ve vergi levhası gibi kurum içi veya carilerle ilgili resmi belgeleri bulut depolama mantığıyla saklayan, etiket ve kategori tabanlı akıllı dosya arşiv modülüdür.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">15.1 Akıllı Kategorilendirme ve Hızlı Arama</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc mt-1.5">
              <li>Dosyaları türlerine göre (Fatura, Teklif, Sözleşme, Resmi Evrak vb.) otomatik simgelerle görüntüleyebilirsiniz.</li>
              <li>Eklediğiniz dosyalara özel etiketler ekleyerek binlerce belge arasından saniyeler içinde filtreleme yapabilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 16. PERSONEL & GRANÜLER İZİN (PERSONEL) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'personel' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-855 my-0">16. Personel, Puantaj, Maaş Bordrosu & Granüler İzin Yetkileri</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizde çalışan personellerin özlük dosyalarını, günlük puantaj ve mesai hesaplarını, maaş bordrolarını, avans/prim ödemelerini, yıllık izin dökümlerini ve sisteme giriş yetkilerini yöneten İK modülüdür.
            </p>

            {/* Portal Visual Mockup: Personel */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Sanal Ekran: Kısıtlı Kullanıcı İzin & Bordro Paneli</span>
                <span className="text-xs bg-red-55 text-red-800 font-bold px-1.5 rounded">Granüler Yetki Aktif</span>
              </div>

              <div className="bg-white border rounded-lg p-3 text-xs space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-gray-700">Ad Soyad: Aylin Kaya (Ön Muhasebe)</span>
                  <span className="text-slate-450 italic">[Kullanıcı Yetki Düzeyi: Kısıtlı]</span>
                </div>
                
                <p className="text-[10px] m-0 text-gray-400">Modül Yetkilendirme Matrisi:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] leading-relaxed">
                  <div className="p-1 px-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-150">✓ Hızlı Satış POS (Aktif)</div>
                  <div className="p-1 px-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-150">✓ Cari Kart Ekleme</div>
                  <div className="p-1 px-2 rounded bg-rose-50 text-rose-800 font-bold border border-rose-150">✗ Personel İzin Yönetimi</div>
                  <div className="p-1 px-2 rounded bg-rose-50 text-rose-800 font-bold border border-rose-150">✗ Kasa Gelir/Gider Girişi</div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.1 Puantaj, Maaş Bordrosu ve Personel Self-Servis Portalı</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Puantaj ve Mesai Hesaplama:</strong> Çalışanların aylık çalışma günleri, fazla mesai saatleri, kesintiler, avanslar ve primler üzerinden net hak edişleri otomatik hesaplanır.</li>
              <li><strong>Resmi Maaş Bordrosu Çıktısı:</strong> Hesaplanan maaşlar için imzalı A4 Maaş Bordrosu ve Tediye Pusulası oluşturulur.</li>
              <li><strong>Personel Portalı & Zimmet Takibi:</strong> Personeller kendi ekranlarından izin talebi oluşturabilir ve üzerlerine zimmetli şirket demirbaşlarını görüntüleyebilirler.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 17. CARİ MUTABAKAT (MUTABAKAT) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'mutabakat' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Handshake className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">17. Dijital Cari Mutabakat (BA/BS & Bakiye) ve Bulut Onaylama</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşterileriniz ve tedarikçileriniz ile aranızdaki dönem sonu bakiyelerinin karşılıklı uyuşup uyuşmadığını, kağıt mektup göndermeden doğrudan e-posta veya WhatsApp üzerinden şifreli link göndererek doğrulayan dijital mutabakat otomasyonudur.
            </p>

            {/* Portal Visual Mockup: Mutabakat */}
            <div className="my-6 border border-emerald-600/25 rounded-xl bg-slate-900 text-slate-100 p-4 max-w-lg mx-auto">
              <div className="border-b border-emerald-950 pb-2 mb-3 text-center text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                ESİLA SECURE VERIFICATION // MUTABAKAT
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Sayın Müşteri Yetkilisi, sistemlerimizde kayıtlı bakiye dökümünüz aşağıdadır:
              </p>
              <div className="bg-slate-850 border border-slate-800 rounded-lg p-3 my-2.5 text-center">
                <span className="text-[9px] text-slate-400 font-medium block uppercase tracking-wide">Dönem Sonu Karşılıklı Bakiye</span>
                <p className="text-xl font-bold text-emerald-400 m-0 mt-0.5">₺87,950.00 <span className="text-xs font-normal text-slate-350">Borç Bakiye</span></p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1.5 rounded text-center">✓ BAKİYE DOĞRUDUR</button>
                <button className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-1.5 rounded text-center">✗ REDDET / İTİRAZ ET</button>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">17.1 Online Doğrulama Linki, WhatsApp ve E-Posta Gönderimi</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li>Her mutabakat kaydı için benzersiz güvenlik token'ı içeren <strong>Onay Paylaşım Linki</strong> üretilir.</li>
              <li>Müşteri linke tıklayıp "Bakiye Doğrudur" veya "İtiraz Et" butonuna bastığında, mutabakat durumu panelinizde anında güncellenir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 18. ARIZA & TEKNİK SERVİS (ARIZA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'ariza' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Wrench className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">18. Arıza Kayıtları ve Teknik Servis Takip Modülü</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Tamir, garanti veya periyodik bakım amacıyla getirilen cihazların seri numaralarından takibini, yedek parça kullanımını ve servis durum sorgulamasını koordine eden teknik servis otomasyonudur.
            </p>

            {/* Portal Visual Mockup: Ariza */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4 text-xs">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Servis İş Emri Kabul Fişi</span>
                <span className="text-amber-700 bg-amber-50 px-2 rounded-full font-bold">Tamir Aşamasında</span>
              </div>
              <div className="bg-white border rounded p-3 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] leading-relaxed">
                  <div>
                    <span className="text-gray-450 block uppercase text-[8px]">Marka & Model</span>
                    <strong className="text-slate-800">Esila Pro Soundbar V12</strong>
                  </div>
                  <div>
                    <span className="text-gray-450 block uppercase text-[8px] font-bold">Cihaz Seri No</span>
                    <strong className="text-slate-800 font-mono">SN987654321A</strong>
                  </div>
                  <div>
                    <span className="text-gray-450 block uppercase text-[8px]">Bakım Periyodu</span>
                    <strong className="text-emerald-800">Her 6 Ayda Bir</strong>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">18.1 Seri Numarası, Periyodik Bakım ve QR Kodlu Takip</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc leading-relaxed">
              <li><strong>Seri Numarası ve Periyodik Bakım:</strong> Cihaza bakım periyodu girildiğinde, sistem teslim tarihinden ilgili ay kadar sonrasına Ajanda'da otomatik <strong>Periyodik Bakım İş Emri</strong> oluşturur.</li>
              <li><strong>QR Kodlu Servis Fişi (A4 & 80mm Termal):</strong> Kabul fişi üzerindeki QR kodu okutan müşteri, cihazının tamir durumunu online olarak sorgulayabilir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 19. AJANDA & HATIRLATICI (AJANDA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'ajanda' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">19. Ajanda, Randevu Planlayıcı ve Konsolide Görev Takvimi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Şirketinizin tüm saha operasyonlarını, müşteri ziyaretlerini, gelen fatura son ödeme günlerini, çek/senet vadelerini ve periyodik servis bakımlarını tek bir akıllı takvimde birleştiren planlama modülüdür.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">19.1 Otomatik Entegre Hatırlatıcılar</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Fatura ve Çek Vadeleri:</strong> Gelen faturaların ve çek/senetlerin vade günleri takvime otomatik işlenir.</li>
              <li><strong>Görev Atama (To-Do):</strong> Personellere gün ve saat bazlı görev atanabilir, tamamlanma durumları izlenebilir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 20. RAPORLAR (RAPORLAR) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'raporlar' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">20. Gelişmiş Finansal Raporlar, Nakit Akışı & KDV Analizi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Mali müşavirinizin ve yöneticilerin iki tarih aralığında <strong>Nakit Akışı (Cash Flow)</strong>, vergi kırılımları, ürün/cari karlılığı, KPI hedefleri ve ölü stokları analiz ettiği Excel/CSV ihracat uyumlu raporlama merkezidir.
            </p>

            {/* Portal Visual Mockup: Raporlar & Nakit Akisi */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-55 p-3">
              <div className="bg-white border rounded-lg p-3 text-xs shadow-xs space-y-2">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="font-bold text-slate-800 text-[10px] uppercase">Nakit Akışı (Cash Flow) & KDV Konsolidasyon Raporu</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">CSV / Excel İhracat Aktif</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] py-1">
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                    <span className="text-emerald-700 block">Toplam Nakit Girişi</span>
                    <strong className="text-emerald-900 font-mono text-xs">₺412,800.00</strong>
                  </div>
                  <div className="bg-rose-50 p-2 rounded border border-rose-100">
                    <span className="text-rose-700 block">Toplam Nakit Çıkışı</span>
                    <strong className="text-rose-900 font-mono text-xs">₺184,300.00</strong>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="text-blue-700 block">Net Nakit Akışı</span>
                    <strong className="text-blue-900 font-mono text-xs">+₺228,500.00</strong>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">20.1 Nakit Akışı (Cash Flow) Sekmesi</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Detaylı Nakit Akışı Analizi:</strong> Seçilen dönemdeki toplam nakit girişleri, nakit çıkışları, net nakit akışı, tahsilat oranı, ödeme yöntemi dağılımı (Nakit, Kredi Kartı, Havale/EFT) ve günlük nakit hareketleri grafiksel ve tablosal olarak sunulur.</li>
              <li><strong>Tek Tıkla CSV / Excel Aktarımı:</strong> Nakit akışı ve KDV raporlarını muhasebe süreçleriniz için tek tıkla indirebilirsiniz.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">20.2 Ölü Stok, Cari Yaşlandırma ve Kar-Zarar Raporları</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>İşlem Görmeyen Ürünler (Ölü Stok):</strong> Belirli tarihler arasında hiç satılmamış ürünleri maliyet değerleriyle tespit eder.</li>
              <li><strong>Cari Yaşlandırma ve Ürün Karlılık Analizi:</strong> Alacakların gecikme sürelerini ve ürün bazlı net brüt kar marjlarını raporlar.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 21. TEKLİF YÖNETİMİ (TEKLİF) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'teklif' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileBadge className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">21. Teklif Hazırlama ve İnteraktif Müşteri Bulut Onay Linki</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşterilerinize kurumsal fiyat teklifleri hazırlayan, teklif durumlarını izleyen ve müşterinin online şifreli web linki üzerinden teklifi onaylamasını veya revize talep etmesini sağlayan modüldür.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">21.1 Online Teklif Kabulü ve Tek Tıkla Satışa/Faturaya Dönüştürme</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Bulut Paylaşım Linki:</strong> Müşteriye gönderilen güvenli link üzerinden müşteri teklifi inceleyip "Onaylıyorum" butonuna bastığında teklif statüsü anında "Onaylandı" olur.</li>
              <li><strong>Tek Tıkla Siparişe/Faturaya Dönüştürme:</strong> Onaylanan teklif yeniden veri girişine gerek kalmadan doğrudan satış faturasına veya siparişe dönüştürülür.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 22. AYARLAR & SİSTEM YEDEKLEME (AYARLAR) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'ayarlar' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <SettingsIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">22. Sistem Ayarları, Veritabanı Kesinti Alarmı, Şablonlar & Yedekleme</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Şirket bilgilerinizi, fatura/fiş görsel tasarım şablonlarını, SMTP e-posta ayarlarını, veritabanı bağlantı kesintisi uyarı sistemini ve JSON tam sistem yedeklemesini yönettiğiniz merkezdir.
            </p>

            {/* Portal Visual Mockup: Ayarlar */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-850">Veritabanı Kesinti Koruması & Yedekleme Merkezi</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 rounded font-bold inline-flex items-center gap-1"><ShieldCheck size={11} /> Otomatik Yönetici Mail Uyarısı Aktif</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-xs">
                <div className="bg-white border rounded p-3 text-center">
                  <span className="font-bold text-emerald-800 block uppercase text-[10px] mb-1">Veritabanı Yedek Dosyası İndir</span>
                  <p className="text-[10px] text-gray-450 mb-2">Bütün şirket verilerinizi tek tıklamayla JSON olarak yerel bilgisayarınıza saklar.</p>
                  <button className="bg-emerald-600 text-white rounded p-1.5 px-3 font-bold text-[10px]">Şirket Yedeğini İndir (.json)</button>
                </div>
                <div className="bg-white border rounded p-3 text-center">
                  <span className="font-bold text-rose-800 block uppercase text-[10px] mb-1">Kesinti Anında Yönetici E-Posta Alarmı</span>
                  <p className="text-[10px] text-gray-450 mb-2">Uzak MySQL bağlantısı kesildiğinde yöneticiye otomatik uyarı e-postası gönderilir ve yerel koruma devreye girer.</p>
                  <button className="bg-slate-800 text-white rounded p-1.5 px-3 font-bold text-[10px]">Bağlantı Testi & Bildirim Gönder</button>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">22.1 Veritabanı Bağlantı Kesintisinde Otomatik Yönetici E-Posta Bildirimi</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Otomatik Kesinti Algılama ve E-Posta Uyarısı:</strong> Ana MySQL veritabanı ile bağlantı koptuğunda veya erişim hatası oluştuğunda sistem otomatik olarak sistem yöneticisine (admin e-posta adresine) hata kodu, zaman damgası ve çözüm adımlarını içeren acil durum e-postası gönderir.</li>
              <li><strong>Kesintisiz Yerel Yedek (Fallback) Modu:</strong> Uzak veritabanı bağlantısı kopsa dahi işlerinizin durmaması için sistem otomatik olarak yerel veritabanı moduna geçiş yapar ve veri kaybını önler.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">22.2 Fatura & Fiş Tasarım Editörü, SMTP ve Yedekleme</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Görsel Fatura ve Fiş Şablon Editörü:</strong> E-Fatura ve 80mm termal satış fişlerinizin logosunu, kaşe/imza görselini, banka IBAN tablosunu ve alt bilgi notlarını canlı önizleme ile özelleştirebilirsiniz.</li>
              <li><strong>Anlık Manuel ve Otomatik Yedekleme:</strong> Tüm veritabanını tek tıkla <code>.json</code> formatında indirebilir veya mevcut bir yedeği geri yükleyebilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 23. SESLİ ASİSTAN & TTS BİLDİRİM */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'sesliasistan' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Mic className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">23. Sesli Asistan (TTS Bildirim), Sesli Navigasyon & Komut Paleti</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Esila Ticari Pro, görsel uyarıların yanı sıra sistem bildirimlerini Türkçe seslendirir, sesli komutlarla menüler arası geçiş yapmanızı sağlar ve <strong>Ctrl+K</strong> Hızlı Komut Paleti ile tüm modüllere klavyeden erişim sunar.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">23.1 Çalışma Mantığı</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Sesli Bildirim (TTS):</strong> Stok yetersizliği, satış onayı veya tahsilat bildirimleri Türkçe ses profiliyle seslendirilir.</li>
              <li><strong>Sesli Navigasyon:</strong> Mikrofon ikonuna tıklayarak "Hızlı Satışa git", "Carileri aç", "Raporları göster" gibi sesli komutlarla ekranlar arasında eller serbest geçiş yapabilirsiniz.</li>
              <li><strong>Hızlı Komut Paleti (Ctrl+K):</strong> Klavyeden <code>Ctrl + K</code> tuşlarına basarak arama penceresini açabilir, saniyeler içinde istediğiniz modüle veya işleme atlayabilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 24. LİSANS YENİLEME & HAVALE/EFT ÖDEME BİLDİRİMİ */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'lisansodeme' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Landmark className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">24. Kurumsal Kayıt, Lisans Aktivasyonu ve Banka Havale / EFT Ödeme Bildirimi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Kullanıcı giriş ekranında yer alan <strong>"Kayıt Ol"</strong> ve <strong>"Ödeme Yap"</strong> sekmeleri üzerinden yeni firma kaydı oluşturabilir veya mevcut lisans ödemelerinizi doğrudan <strong>Banka Havale / EFT Bildirimi</strong> ile gerçekleştirebilirsiniz.
            </p>

            {/* Portal Visual Mockup: Lisans Odeme */}
            <div className="my-6 border border-emerald-600/25 rounded-xl bg-slate-900 text-slate-100 p-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3 text-[10px]">
                <span className="font-bold text-emerald-400 uppercase tracking-wider">GİRİŞ EKRANI // BANKA HAVALE & EFT ÖDEME BİLDİRİMİ</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">IBAN Kopyala & Bildir</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-850 border border-slate-800 rounded-lg p-3 space-y-1.5">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase block">1. Kurumsal Banka Hesapları (IBAN)</span>
                  <p className="text-[11px] font-bold text-white m-0">QNB Finansbank / Garanti BBVA / Ziraat Bankası</p>
                  <p className="text-[10px] font-mono text-slate-300 m-0">TR93 0011 1000 0000 0098 7654 32</p>
                  <span className="text-[9px] text-slate-400 block">Tek tıkla IBAN kopyalama ve açıklama kısmına VKN/TCKN yazma</span>
                </div>
                <div className="bg-slate-850 border border-slate-800 rounded-lg p-3 space-y-1.5">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase block">2. Havale / EFT Bildirim Formu</span>
                  <p className="text-[10px] text-slate-300 m-0">Firma Adı, VKN/TCKN, Gönderen Ad Soyad, Gönderim Yapılan Banka ve Gönderilen Tutar (TL) girilerek onaylanır.</p>
                  <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded inline-block font-bold">✓ Yöneticiye & Müşteriye Otomatik Mail</span>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">24.1 Banka Havale / EFT ile Ödeme ve Bildirim Akışı</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Kurumsal IBAN Hesapları:</strong> Giriş ekranındaki <strong>"Ödeme Yap"</strong> sekmesine tıkladığınızda anlaşmalı kurumsal banka hesaplarımız ve IBAN numaralarımız listelenir. Yanındaki kopyala butonu ile IBAN numarasını tek tıkla kopyalayabilirsiniz.</li>
              <li><strong>Havale / EFT Bildirim Formu:</strong> Banka üzerinden transferinizi gerçekleştirdikten sonra aynı ekrandaki bildirim formuna <strong>Firma Adı / Ad Soyad, Vergi No / TCKN, Telefon, E-Posta, Havale Gönderen Ad Soyad, Gönderim Yapılan Banka, Gönderilen Tutar (TL)</strong> ve dekont açıklamasını girerek <strong>"Havale / EFT Ödeme Bildirimini Gönder"</strong> butonuna basmanız yeterlidir.</li>
              <li><strong>Anlık Kayıt ve Otomatik E-Posta Onayı:</strong> Bildiriminiz veritabanına referans numarasıyla kaydedilir, sistem yöneticisine anında onay bildirimi düşer ve e-posta adresinize bilgilendirme mesajı iletilir.</li>
            </ul>
          </section>

          <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col items-center text-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Esila Ticari Pro Otomasyonu - Versiyon 4.5 (24 Modül Güncel Rehber)</span>
            <p className="text-xs text-gray-500 m-1">Bulut veri tescili Esila Ticari kurumsal sözleşmesi kapsamında koruma altındadır.</p>
            <p className="text-[9px] text-gray-405 mt-1">Esila E-Fatura entegrasyon lisans ortağı tarafından tescil edilmiştir.</p>
          </div>
        </div>
      </div>

      {/* Styled Printable Stylesheet inside the component specifically for flawless output */}
      <style>{`
        @media print {
          /* Hide standard elements from view completely */
          .no-print, header, nav, aside, .sidebar, .header, #sidebar, #header {
            display: none !important;
          }
          #printable-user-manual {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .flex-col, .lg:flex-row {
            display: block !important;
          }
          .flex-1 {
            padding: 0 !important;
          }
          .section-block {
            display: block !important;
            page-break-inside: avoid !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 2rem !important;
            margin-bottom: 2rem !important;
          }
          .page-break-before {
            page-break-before: always !important;
          }
          .print-header {
            display: block !important;
          }
          kbd {
            background: #eee !important;
            border: 1px solid #ccc !important;
            color: black !important;
            padding: 0px 4px !important;
            border-radius: 2px !important;
            font-size: 10px !important;
          }
          .visual-illustration, .grid, table, tbody, tr, td, th {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
