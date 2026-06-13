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
  Globe,
  FileBadge,
  Handshake,
  Zap,
  Wrench,
  CalendarDays,
  ScanLine,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Mail,
  MessageSquare,
  Search,
  DollarSign
} from 'lucide-react';

export const UserManual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'hizlisatis'
    | 'cariler'
    | 'urunler'
    | 'siparisler'
    | 'efatura'
    | 'depo'
    | 'sayim'
    | 'kasa'
    | 'personel'
    | 'mutabakat'
    | 'ariza'
    | 'ajanda'
    | 'raporlar'
    | 'teklif'
    | 'ayarlar'
  >('dashboard');

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const sectionsList = [
    { id: 'dashboard', label: '1. Panel (Dashboard)', icon: LayoutDashboard },
    { id: 'hizlisatis', label: '2. Hızlı Satış (POS)', icon: Zap },
    { id: 'cariler', label: '3. Cari Yönetimi', icon: Users },
    { id: 'urunler', label: '4. Ürün Envanteri (Stok)', icon: Package },
    { id: 'siparisler', label: '5. Sipariş Yönetimi', icon: ShoppingCart },
    { id: 'efatura', label: '6. E-Fatura & E-Arşiv', icon: FileText },
    { id: 'depo', label: '7. Çoklu Depo & Sevk', icon: Warehouse },
    { id: 'sayim', label: '8. Stok Sayım & Denetim', icon: ScanLine },
    { id: 'kasa', label: '9. Kasa & Nakit Akışı', icon: Wallet },
    { id: 'personel', label: '10. Personel & Granüler İzin', icon: UserCheck },
    { id: 'mutabakat', label: '11. Cari Mutabakat (Dijital)', icon: Handshake },
    { id: 'ariza', label: '12. Arıza & Teknik Servis', icon: Wrench },
    { id: 'ajanda', label: '13. Ajanda & Hatırlatıcı', icon: CalendarDays },
    { id: 'raporlar', label: '14. Gelişmiş Finansal Raporlar', icon: FileText },
    { id: 'teklif', label: '15. Teklif & Bulut Onay', icon: FileBadge },
    { id: 'ayarlar', label: '16. Ayarlar, SMTP & Yedekleme', icon: SettingsIcon },
  ];

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
            Sistem içindeki tüm <strong>16 ana menünün</strong> detaylı çalışma prensipleri, görsel arayüz simülasyonları ve kurumsal akış ayarları aşağıda modüler olarak listelenmiştir.
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
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Menü Seçenekleri</h2>
          <nav className="space-y-1 max-h-[640px] overflow-y-auto pr-1">
            {sectionsList.map((section) => {
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
                <li>Baskı Hedefi: <strong>PDF Kaydet</strong></li>
                <li><strong>Arka Plan Grafikleri</strong> aktif.</li>
                <li>Kenarlıklar: <strong>Yumuşak Sıfır</strong></li>
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
                <p className="text-gray-600 text-xs m-1">Kapsamlı Bulut Entegre Ticari Otomasyon ve Kurumsal Kaynak Yönetimi Kılavuzu</p>
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
              Yönetici Paneli, firmanızın anlık finansal özetini, kritik seviyedeki stok uyarılarını, günlük ciro grafiklerini ve bekleyen iş listelerini tek bir ekranda toplayan konsolide izleme merkezidir.
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
              <li><strong>Anlık Finansal Takip:</strong> Sayfayı her yenilediğinizde veritabanından en güncel satış, alış, kasa ve cari bakiyeleri anında derlenir. Bilgiler önbelleğe alınmaz, dinamiktir.</li>
              <li><strong>Kritik Seviye Mal Alarmları:</strong> Tanımladığınız asgari stok limitinin (örneğin rafta en az 5 adet olmalıdır sınırlaması) altına düşen malzemeler otomatik algılanarak satınalmacınıza iş emri olarak listelenir.</li>
              <li><strong>Hızlı Erişim Kartları:</strong> İlgili finansal kutunun üzerine tıkladığınızda sistem sizi otomatik olarak ilgili detaylı raporlama veya kayıt listesi sayfasına yönlendirir.</li>
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">2. Hızlı Satış Modülü (Perakende POS Kasa)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Barkod okuyucular, dikey dokunmatik LCD ekranlar ve hızlı fiş yazıcılar ile anlık perakende satışı sağlayan; kasiyerlerin fatura kesme hızını maksimize eden pratik satış ekranıdır.
            </p>

            {/* Portal Visual Mockup: Hizli Satis */}
            <div className="my-6 border border-emerald-950/20 rounded-xl bg-slate-900 text-slate-100 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[10px]">
                <span className="font-bold text-emerald-400 uppercase tracking-widest">KASA terminal // pos-1</span>
                <span className="font-mono bg-slate-800 text-slate-350 px-2 py-0.5 rounded">Kasiyer: Ahmet D.</span>
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

            <h3 className="text-base font-bold text-gray-800 mt-4">2.1 Hızlı Satış, Barkod ve Mobil Kamera Entegrasyonu</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Sisteminizdeki fiziki USB barkod okuyucu tabancayı bilgisayara bağladığınızda sisteme başka hiçbir işlem yapmanıza gerek kalmaz. Okutulan barkod doğrudan arama alanını tetikler ve ürünü sepete ekleyerek imleci yeniden tarama aşamasına hazır hale getirir.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-150">
              <strong>Mobil Cihaz ve Telefon Kamerası ile Tarama:</strong> Saha satışlarında veya el terminallerinin bulunmadığı durumlarda, kasiyerler veya satış personeli doğrudan akıllı telefon veya tablet kameralarını kullanarak barkod okutabilir. Ekrandaki kamera ikonuna basıldığında tarayıcı kamera katmanı açılır ve cihazın kamerasını barkoda tutarak saniyeler içerisinde ürünü tanır ve sepete atar. Bu özellik sayesinde pahalı el terminallerine yatırım yapmadan işyerinizdeki her akıllı telefonu anında tam donanımlı bir mobil POS terminaline dönüştürebilirsiniz.
            </p>
            <h3 className="text-base font-bold text-gray-800 mt-4">2.2 Klavye Kısayolları (Süper Hızlı Çalışma Mantığı)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F1</span> <span className="font-semibold text-emerald-800">Nakit Satış</span></div>
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F2</span> Ara & Odaklan</div>
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F4</span> <span className="font-semibold text-blue-800">Kredi Kartı</span></div>
              <div className="bg-slate-50 p-2.5 border rounded-lg text-center"><span className="font-mono bg-white border px-1.5 py-0.5 rounded shadow-xs font-bold text-gray-800 mr-2">F5</span> <span className="font-semibold text-amber-800">Cariye Borç</span></div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 3. CARİ YÖNETİMİ (CARİLER) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'cariler' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">3. Cari Kart Yönetimi (Müşteri & Tedarikçi Finans Defteri)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşteri ve alıcı firmalar ile mal aldığınız tedarikçi (toptancı) hesaplarının borç/alacak bakiyelerini, vadelendirmelerini, yasal fatura kimliklerini ve risk sınırlarını organize eden ana modüldür.
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

            <h3 className="text-base font-bold text-gray-800 mt-4">3.1 Granüler Saha Satış Temsilcisi Sınırlaması</h3>
            <p className="text-sm text-gray-700">
              Bu sistemin en kritik kurumsal yeteneği <strong>Müşteri Temsilcisi Atama</strong> altyapısıdır. Şahıs/Tüzel cari açılırken kartın altından bir personel "Satış Temsilcisi" tayin edildiğinde:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li>Eğer sisteme giriş yapan kullanıcı "admin" değilse, yalnızca <strong>kendisinin sorumlu olduğu carileri</strong> listeleyebilir.</li>
              <li>Diğer satışçıların carilerini, onların bakiyelerini veya telefon numaralarını göremez ve değiştiremez.</li>
              <li>Böylelikle saha satış operasyonlarında müşteri portföy hırsızlığı engellenir.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">3.2 Cari Hesap Hareket Detayları (Cari Ekstre)</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Her müşterinin veya tedarikçinin profiline girdiğinizde, onlarla yapılan tüm finansal geçmişi kronolojik bir sırada gösteren <strong>Cari Hareket Detayı</strong> yer alır. Cari harekette:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc mt-1">
              <li>Her faturanın, tahsilat makbuzunun, tediye fişinin, iade faturasının ve kur farkı dekontunun tarihi, evrak numarası, işlem türü ve borç/alacak tutarları net olarak tablo halinde listelenir.</li>
              <li>Kayıtların yanındaki butonlar ile doğrudan ilgili faturaya veya tahsilatın kaynağına (kasa, banka) saniyeler içerisinde köprü bağlantı ile ulaşabilirsiniz.</li>
              <li>Seçili tarih aralıklarına göre cari hesap ekstresi süzülebilir, anlık bakiye yürütmeli liste çıktısı alınabilir.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">3.3 Çok Kanallı Dijital Cari Bildirim Sistemi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Müşterilerinize borç bakiye durumlarını, vadesi gelmiş ödemeleri ve cari hesap ekstrelerini bildirmek için Esila Ticari son derece pratik ve esnek bildirim kanalları sunar:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc mt-1">
              <li><strong>WhatsApp Bildirimi:</strong> Tek tıklama ile müşteriye özel hazırlanmış bakiye şablon metni WhatsApp Web / Masaüstü uygulaması üzerinden (ya da API entegrasyonuyla) müşterinin GSM hattına gönderilir. Müşteri mesajın içindeki güvenli bağlantıya basarak anlık borcunu görebilir.</li>
              <li><strong>SMS Bildirimi:</strong> Entegre SMS paneli (Netgsm, Mutlucell vb.) üzerinden hazırladığınız özel dinamik parametreli SMS şablonu alıcının cep telefonuna anında SMS olarak fırlatılır.</li>
              <li><strong>E-Posta Bildirimi:</strong> Cari hareket detaylarının ve borç durumunun şık, kurumsal bir HTML e-posta tasarımı ile müşteriye gönderilmesidir. Cari ekstre PDF formatında e-postaya otomatik olarak eklenir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 4. ÜRÜN ENVANTERİ (ÜRÜNLER) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'urunler' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">4. Ürün Envanter Kaydı (Mal, Stok & Barkod Kartları)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizin alıp sattığı tüm emtiayı, ticari malları veya hizmet çeşitlerini; barkod, KDV sınıfı, alış/satış fiyatı, tedarik maliyetleri ve kategorileriyle saklayan merkezi stok kütüphanesidir.
            </p>

            {/* Portal Visual Mockup: Ürünler */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Sanal Ekran: Envanter Detay Kartı</span>
                <span className="bg-emerald-100/60 text-emerald-900 px-2 rounded">Tip: Fiziksel Mal</span>
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

            <h3 className="text-base font-bold text-gray-800 mt-4 font-sans">4.1 Toplu Fiyat ve Barkod Özellikleri</h3>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc">
              <li><strong>Toplu Fiyat Revizyon Sihirbazı:</strong> Enflasyonist dönemlerde veya maliyet değişimlerinde belirli bir kategori, marka bazında toplu olarak satış fiyatlarına tek tıkla yüzdesel artış (+%) uygulayabilir, bütün veritabanını 2 saniyede güncelleyebilirsiniz.</li>
              <li><strong>Toplu Barkod Etiket Şablonu:</strong> Seçili ürünlerden istediğiniz adetlerde <strong>50x30mm standart termal sticker etiketler</strong> oluşturarak masaüstü veya sarmal etiket yazıcılarından çıkarabilirsiniz.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 5. SİPARİŞ YÖNETİMİ (SİPARİŞLER) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'siparisler' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">5. Sipariş Yönetim Modülü (Alış & Satış Siparişleri)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşterilerinizden toplanan tedarik siparişleri ile sizin toptancı firmalara geçtiğiniz satınalma siparişlerini ve bunların lojistik aşamalarını koordine eden ticari akış motorudur.
            </p>

            {/* Portal Visual Mockup: Siparişler */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-850">Sipariş İşlem Safhası Simülatörü</span>
                <span className="font-medium">No: ES-2026-613</span>
              </div>

              <div className="flex justify-between items-center max-w-lg mx-auto py-3 relative">
                {/* Simulated Step bar */}
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

            <h3 className="text-base font-bold text-gray-800 mt-4">5.1 Siparişte Rezerve Stok ve Tamamlama Mantığı</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Sipariş statüsü **Oluşturuldu/Hazırlanıyor** durumunda iken eklediğiniz ürünlerin adetleri fiziksel stoktan kalıcı olarak düşülmez; ancak sistemde o siparişe adanmış olarak **rezerve** edilir. Sipariş statüsü yönetici tarafından **Tamamlandı** statüsüne geçirildiğinde:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li>Müşteri cari hesabına borç otomatik işlenir.</li>
              <li>Rezerve edilen stok adetleri ilgili depodan kalıcı olarak düşer ve envanter defteri resmiyet kazanır.</li>
              <li>Sayfadaki yan menüden tek tıkla Esila E-Fatura entegrasyonlu faturalandırma adımı tetiklenebilir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 6. E-FATURA & E-ARŞİV (EFATURA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'efatura' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">6. Esila E-Fatura Entegrasyonu ve E-Arşiv Portalı</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Resmi standartlarda, kağıt fatura kesim ve basım ihtiyacını ortadan kaldırarak saniyeler içinde kurumsal e-fatura veya vatandaş e-arşiv belgeleri üreten, kurumsal muhasebenizi buluta taşıyan <strong>Esila E-Fatura Entegrasyonu</strong> altyapısıdır.
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

            <h3 className="text-base font-bold text-gray-800 mt-4">6.1 Akıllı Müşteri Sorgulama ve Gönderim Akışı</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Müşteriye ait vergi kimlik numarası (VKN) veya T.C. Kimlik numarası sorgulandığı an sistem <strong>Esila E-Fatura Entegrasyonu</strong> bulut sunucularımıza gider. Alıcının e-fatura havuzunda tescili varsa faturayı otomatik olarak yeşil renkli **E-Fatura** formatına alır ve onun resmi gelen kutusuna fırlatır. Alıcı mükellef değilse, sistem resmi **E-Arşiv Fatura (PDF)** oluşturup, müşterinin cep telefonuna ve e-posta adresine anında gönderimi sağlar.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">6.2 Gelen Faturaların Otomatik Cari ve Ürün Eşleştirmesi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Tedarikçilerinizin size kestiği faturalar da <strong>Esila E-Fatura Entegrasyonu</strong> gelen kutunuza anlık olarak düşer. Sistem bu gelen XML faturalarını tarayarak size olağanüstü kolaylıklar sunar:
            </p>
            <ul className="text-sm space-y-2 text-gray-650 pl-5 list-disc mt-1.5">
              <li><strong>Otomatik Cari Kaydı:</strong> Faturayı kesen firma sisteminizde kayıtlı değilse, XML dosyasındaki VKN, Unvan, Adres ve İletişim bilgilerini ayrıştırarak saniyeler içinde yeni bir **Tedarikçi Cari Kartı** açar.</li>
              <li><strong>Otomatik Ürün Eşleştirme ve Stok Kaydı:</strong> Gelen faturadaki ürün kalemlerinin barkodlarını veya ürün isimlerini sistem envanterinizle kıyaslar. Eğer ürün sisteminizde bulunuyorsa stoğunu faturadaki miktar kadar artırır. Eğer ürün sisteminizde mevcut değilse, faturadaki adı, birimi, alış fiyatı ve KDV oranını alarak sistemde otomatik olarak yeni bir **Ürün Kartı** tanımlar.</li>
              <li><strong>Otomatik Ödeme Hatırlatıcı Takvimi:</strong> Faturanın vade tarihini / ödeme koşulunu ayrıştırarak **Ajanda (Takvim)** modülüne otomatik olarak <strong>Gelen Fatura Ödeme Hatırlatması</strong> ekler, böylece tedarikçi borçlarının ödeme gününü kaçırmanızı engeller.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 7. ÇOKLU DEPO & SEVK (DEPO) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'depo' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Warehouse className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-855 my-0">7. Çoklu Depo Yönetimi & Depolar Arası Sevk (Transfer)</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizin şubeleri, merkez ambarı veya farklı bölge depoları arasındaki güncel stok dağılımını izleyen ve kontrollü ürün transferini sağlayan lokasyon bazlı envanter modülüdür.
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

            <h3 className="text-base font-bold text-gray-800 mt-4">7.1 Çoklu Depo Çalışma Akışı</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Esila Ticari'de bir ürünün stok adeti şirketin tamamında tek bir sayı olarak birikmez. Her ürünün tanımlanan her deponun gözünde farklı miktarda stok sayıları yer alır. Mağazalar arası ürün gönderirken mutlaka **Depolar Arası Sevk Fişi** kullanılmalıdır. Fiş onaylandığında kaynak depodaki stok miktarı azalırken hedef depodaki stok miktarı otomatik olarak artar, böylece malzemeleriniz nakliye sürecince de sanal olarak tam olarak izlenir.
            </p>
          </section>

          {/* ========================================================= */}
          {/* 8. STOK SAYIM & DENETİM (SAYIM) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'sayim' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <ScanLine className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-855 my-0">8. Stok Sayımı ve Fiili Envanter Sapma Denetimi</h2>
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
                      <th className="p-2">Sapma Sapması</th>
                      <th className="p-2">Finans Fark Fişi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-650">
                    <tr>
                      <td className="p-2 font-medium">Esila Pro Kablosuz Mouse</td>
                      <td className="p-2 font-mono">152 Adet</td>
                      <td className="p-2 font-mono">150 Adet</td>
                      <td className="p-2 font-bold text-red-650 font-mono">-2 Adet (Kayıp)</td>
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

            <h3 className="text-base font-bold text-gray-800 mt-4">8.1 Sayım Sıfırlama ve Geri Yükleme</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Mağaza personeli el terminali ile rafları taratıp sayılan adeti sisteme girdiğinde, sistem anlık olarak karşılaştırma raporu üretir. Yönetici **Sayımı Onayla ve Stoğu Güncelle** butonuna bastığı an bilgisayardaki stoklar otomatik olarak **fiili sayılan** gerçek sayılara güncellenir. Oluşan eksiklikler için otomatik olarak gider fişi, fazlalıklar içinse gelir fişi kesilerek muhasebe dengesi korunur.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">8.2 Barkod ve Telefon Kamerası ile Esnek Mobil Sayım</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Esila Ticari stok sayım modülü, geniş veya parçalı depolarda sayım yaparken operasyonel esnekliği en üst düzeye çıkarır. Standart el terminali kablosuz barkod okuyucuların yanı sıra:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Telefon veya Tablet Kamerası ile Doğrudan Tarama:</strong> Kendi cihazınızın kamerasını kullanarak doğrudan raflardaki ürünlerin barkodunu saniyeler içerisinde okutabilir, miktar girişini anında cep telefonunuzdan yapabilirsiniz.</li>
              <li><strong>Eşanlı Çoklu Cihaz Desteği:</strong> Farklı koridorlarda ve depolarda görevli birden fazla personel kendi cep telefonlarıyla aynı anda sisteme bağlanıp ortak bir sayım listesine veri tarayabilir; sistem miktar çakışmalarını akıllıca birleştirir.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 9. KASA & NAKİT AKIŞI (KASA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'kasa' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Wallet className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">9. Finansal Kasa ve Genel Nakit Akışı Yönetimi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizin sıcak para girdi ve çıktılarını takip eden Nakit, Kredi Kartı POS (Banka) kasalarını; personel yol/yemek, dükkan kirası gibi şirket genel giderlerini kayıt altına alan merkezdir.
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

            <h3 className="text-base font-bold text-gray-800 mt-4">9.1 Günlük Kasa Kapatma ve Gider Tasnifi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Her akşam dükkan kapanırken kasa görevlisi fiziki çekmecedeki nakit parayı sayarak sistemdeki "Nakit Kasası" değeriyle mutabık kalır. Gider kayıt ederken elektrik faturası, kargo bedeli, dükkan kirası gibi alt etiketlerin girilmesi fırın, market veya ofis maliyetlerinizin ay sonunda net kârlılık rasyosuna kusursuz yansımanı sağlar.
            </p>
          </section>

          {/* ========================================================= */}
          {/* 10. PERSONEL & GRANÜLER İZİN (PERSONEL) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'personel' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-855 my-0">10. Personel Kartları ve Granüler Modül İzin Yetkileri</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              İşletmenizde çalışan personelleri, maaş bordro tarihlerini, yıllık/hastalık izin dökümlerini yöneten ve en önemlisi her personelin sisteme giriş yetkilerini granüler olarak kısıtlayan yönetim modülüdür.
            </p>

            {/* Portal Visual Mockup: Personel */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Sanal Ekran: Kısıtlı Kullanıcı İzin Paneli</span>
                <span className="text-xs bg-red-55 text-red-800 font-bold px-1.5 rounded">Erişim Sınırlı</span>
              </div>

              <div className="bg-white border rounded-lg p-3 text-xs space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold text-gray-700">Ad Soyad: Aylin Kaya (Tezgahtar / Ön Muhasebe)</span>
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

            <h3 className="text-base font-bold text-gray-800 mt-4">10.1 Personel İzin Yönetimi (izin_yonetimi) Güvenlik Prensibi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Ayarlar altında yer alan kullanıcı tanımlama ve personeller sayfasında, her çalışan için **Personel İzin Yetkisi** parametresi yer alır. Bu güvenlik parametresi kapalı olan personeller asla "İzin Yönetimi" sayfasına girip diğer personellerin maaş, özlük, izin hakediş bilgilerini görüntüleyemez, kendilerine izin tanımlayamaz veya diğer kullanıcıların giriş parametrelerini manipüle edemezler.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">10.2 Personel Özlük Dosyası ve Evrak Arşivi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Şirketinizin insan kaynakları standartlarına tam uyum sağlamak için her çalışanın profili altında dijital bir **Özlük Dosyası** bulunur:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Dijital Evrak Saklama:</strong> Kimlik fotokopisi, ikametgah belgesi, adli sicil kaydı, sağlık raporları, SGK işe giriş bildirimleri ve iş sözleşmeleri gibi zorunlu tüm resmi evraklar bulut sunucunuzda PDF veya resim formatında güvenle saklanır.</li>
              <li><strong>Sözleşme Bitiş Alarmları:</strong> Belirli süreli iş akitlerinin veya deneme süresi bitiş tarihlerinin takibi yapılarak önceden İK yetkilisine sistem içi uyarı fırlatılır.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">10.3 Şirket Demirbaş Zimmet Takip Sistemi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Personele tahsis edilen tüm şirket demirbaşları ve operasyonel ekipmanlar, **Zimmet Takip Modülü** ile kayıt altına alınır:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Demirbaş Eşleştirme:</strong> Bilgisayar, akıllı telefon, araç, el terminali gibi şirket malları seri numaraları ve teslim alma fotoğraflarıyla birlikte ilgili personelin zimmet dökümüne işlenir.</li>
              <li><strong>Zimmet Tutanağı Çıktısı:</strong> Tek tıkla yasal olarak geçerli ıslak imzalı zimmet teslim/geri alma tutanağı A4 formatında basılarak arşivlenebilir.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">10.4 Yıllık İzin, Rapor ve Mazeret Süreçleri</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Personellerin hakediş ve çalışma takvimlerini koordine eden entegre **İzin Yönetim Motoru**:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Otomatik Kıdem ve Hakediş Hesaplama:</strong> İşe giriş tarihine göre mevzuata uygun yıllık ücretli izin hakediş gün sayıları sistem tarafından otomatik olarak hesaplanır ve devredilir.</li>
              <li><strong>İzin Onay Akışı:</strong> Çalışan tarafından girilen veya yöneticinin işlediği yıllık izin, hastalık raporu ve mazeret izinleri İK takvimine anında yansır ve personelin maaş/bordro gün hesaplarında otomatik dikkate alınır.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 11. CARİ MUTABAKAT (MUTABAKAT) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'mutabakat' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Handshake className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">11. Dijital Cari Mutabakat ve Online Bulut Onaylama</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşterileriniz ile aranızdaki dönem sonu (Örn: 31.12.2025) bakiyelerinin karşılıklı uyuşup uyuşmadığını, kağıt mektup göndermeden doğrudan cep telefonlarına şifreli link göndererek sağlayan dijital doğrulama otomasyonudur.
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
                <span className="text-[9px] text-slate-400 font-medium block uppercase tracking-wide">31.12.2025 İtibariyle Karşılıklı Bakiye</span>
                <p className="text-xl font-bold text-emerald-400 m-0 mt-0.5">₺87,950.00 <span className="text-xs font-normal text-slate-350">Müşteri Alacak bakiye</span></p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1.5 rounded transition-transform active:scale-95 text-center">✓ BAKİYE DOĞRUDUR</button>
                <button className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-1.5 rounded transition-transform active:scale-95 text-center">✗ REDDET / İTİRAZ ET</button>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">11.1 Online Doğrulama Link Paylaşım Yaklaşımı</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Her mutabakat kaydı için sistem kendine has şifreli güvenlik token'ı barındıran tamamen bulut tabanlı bir <strong>"Onay Paylaşım Linki"</strong> üretir. Kartı açan müşteri "Bakiye Doğrudur" butonuna dokunduğu an mutabakat kaydı sizde anlık olarak **Doğrulandı** statüsüne yeşil ışık olarak döner. Kağıt, kargo, kurye, kaşe ve ıslak imza yükü tamamen tarihe karışır.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">11.2 WhatsApp ile Hızlı Mutabakat Gönderimi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Müşterilerinize resmi mutabakat mektupları hazırlamak ve bunları faks veya e-posta ile günlerce takip etmek yerine, anlık olarak WhatsApp üzerinden bildirim gönderebilirsiniz:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Şablonlu İleti Gönderimi:</strong> Sistem otomatik olarak "Sayın Yetkili, [Firma_Adi] olarak [Tarih] tarihi itibariyle cari bakiye mutabakatımız ₺[Bakiye] tutarındadır..." şablonunu oluşturur ve sonuna online doğrulama linkini ekler.</li>
              <li><strong>Tek Tıkla Mobil Gönderim:</strong> "WhatsApp ile Gönder" seçeneğine bastığınızda WhatsApp Web veya mobil uygulaması otomatik tetiklenerek ilgili numaranın sohbet ekranına mesajı hazır olarak bırakır.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">11.3 E-Posta ile Resmi Mutabakat İşlemleri</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Resmiyet derecesi yüksek kurumsal mutabakat operasyonları için sistemin SMTP e-posta motoru kullanılır:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>PDF Ekli HTML Mail Tasarımı:</strong> Cari mutabakat ekstresi otomatik olarak PDF formatında e-postaya eklenir. Mail gövdesinde müşterinin tıklayacağı "Mutabıkız" veya "Mutabık Değiliz" hızlı onay butonları yer alır.</li>
              <li><strong>Otomatik Durum Güncelleme:</strong> Alıcı e-postadaki butona bastığında, tarayıcısında açılan güvenli Esila doğrulama portalı üzerinden mutabakatı doğrular. Süreç anlık olarak sizin panelinize "Müşteri Tarafından Onaylandı (E-Posta)" simgesiyle yansır.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 12. ARIZA & TEKNİK SERVİS (ARIZA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'ariza' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <Wrench className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">12. Arıza Kayıtları ve Teknik Servis Takip Modülü</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Mağazanıza tamir veya servis bakım amacıyla getirilen elektronik cihazların, beyaz eşyaların veya endüstriyel makinelerin seri numaralarından takibini koordine eden servis otomasyonudur.
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
                    <span className="text-gray-450 block uppercase text-[8px] font-bold">Cihaz Seri No (serialNumber)</span>
                    <strong className="text-slate-800 font-mono">SN987654321A</strong>
                  </div>
                  <div>
                    <span className="text-gray-450 block uppercase text-[8px]">Bakım Periyodu (recurrencePeriod)</span>
                    <strong className="text-emerald-800">Her 6 Ayda Bir (Zorunlu)</strong>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="m-0 font-bold text-gray-700 text-[10px]">Tespit Edilen Arıza Açıklaması:</p>
                  <p className="m-0 text-slate-500 text-[10px] mt-0.5">Müşteri cihazın sol hoparlöründen cızırtı geldiğini belirtti. Kablosu soyuk. Sorumlu Teknisyen: Ali Rıza.</p>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">12.1 Seri Numara (serialNumber) ve Periyodik Bakım Sözleşmeleri</h3>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc leading-relaxed">
              <li><strong>Seri Numarası:</strong> Servise giren her cihazın **Seri Numarasını (serialNumber)** kaydetmek, gelecekte o cihazın kronik arıza geçmişini arayıp bulmaya yarar.</li>
              <li><strong>Bakım Periyodu (maintenancePeriodMonths):</strong> Profesyonel cihaz kiralayan, jeneratör, klima satan veya asansör teknik bakımı yapan firmalar için cihaza **Bakım Periyodu Ay (recurrencePeriod)** girildiğinde, sistem teslim tarihinden o ay kadar sonrasına takvimde otomatik **Periyodik Bakım İş Emri** randevusu üretir. Personel takvimi her sabah açtığında hangi binada veya fırında rutin bakım günü geldiğini görerek adrese sevk edilir.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">12.2 QR Kod ile Uzaktan Servis Sorgulama Sistemi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Kabulü yapılan her teknik servis cihazı için sistem benzersiz bir takip bağlantısı ve buna bağlı **QR Kod** üretir:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Müşteri Tarafından Uzaktan Takip:</strong> Servis kabul fişinde basılan QR kodu, cihaz sahibi firma veya şahıs kendi akıllı telefonunun kamerasını kullanarak taratabilir.</li>
              <li><strong>Sorgulama Ekranı:</strong> Açılan canlı sorgulama sayfasında, telefonla aramaya gerek bulunmaksızın, cihazın "Parça Bekliyor", "Onay Bekliyor", "Tamir Aşamasında" veya "Teslimata Hazır" durum bilgisine ve varsa revizyon tutar detayına uzaktan saniyeler içerisinde erişebilir.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">12.3 Çoklu Yazıcı Çıktı ve PDF Belgeleri (A4, 80mm Termal Slip)</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Teknik iş emirlerinizin ve teslim tutanaklarınızın fiziksel veya dijital döküm entegrasyonu mevcuttur:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>A4 Kurumsal Form Formatı:</strong> Detaylı parça dökümleri, garanti şartları ve karşılıklı imza alanları içeren A4 ebatında resmi mukavele mizanpajlı çıktı.</li>
              <li><strong>80mm Termal Slip Fiş Basımı:</strong> Müşteriye cihaz teslim edilirken saniyeler içinde sevk edilecek küçük, ekonomik termal tezgah boyu slip yazıcılardan basılan 80mm'lik kompakt teslim slips kartı.</li>
              <li><strong>Dijital PDF Formatı:</strong> Tek bir dokunuşla tüm servis fişini PDF belgesi haline getirerek müşteriye WhatsApp veya E-Posta kanalıyla dijital olarak gönderebilme özgürlüğü.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 13. AJANDA & HATIRLATICI (AJANDA) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'ajanda' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">13. Ajanda, Randevu Planlayıcı ve Görev Takvimi</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Şirketinizin tüm saha operasyonlarını, ziyaret sözleşmelerini, ödeme ve tahsilat takvimlerini tek bir akıllı takvime bağlayarak ekibi yöneten planlama modülüdür.
            </p>

            {/* Portal Visual Mockup: Ajanda */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="bg-white border rounded-lg p-3 shadow-xs space-y-2 text-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Takvim Randevu ve Görev Kartı</span>
                <div className="border-l-4 border-emerald-600 bg-emerald-50/50 p-2.5 rounded-r">
                  <div className="flex justify-between items-center.">
                    <h5 className="font-bold text-emerald-900 m-0">Ufuk Bilgi Teknolojileri - Yasal Bakiye Tahsilatı Ziyareti</h5>
                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 rounded">Saat: 14:00</span>
                  </div>
                  <p className="m-0 text-[10px] text-emerald-800/80 mt-1">Görüşülecek Personel: Finans Müdürü Sinem Hanım. Adres: Kadıköy Şube.</p>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4 font-sans">13.1 Randevu ve Görev Ekleme Prensipleri</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Ajanda üzerinde oluşturduğunuz her randevunun durumunu (Taslak, Devam Ediyor, Tamamlandı, İptal Edildi) anlık olarak değiştirebilirsiniz. Saha satış personelleri kendi hesaplarıyla bağlandıklarında yalnızca idari kadronun kendilerine tayin ettiği randevu kartlarını görebilir, diğer temsilcilerin müşteri randevu günlüklerine erişmeleri yazılımsal güvenlik mekanizmaları gereğince kapatılmıştır.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">13.2 Randevunun Ötesinde: Konsolide Takvim Görevleri</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Esila Ticari Ajandası sadece kuru bir randevu listesi değildir. Sistem içindeki diğer bütün dinamik süreçlerle tam entegre çalışır:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Gelen Fatura Ödeme Hatırlatmaları:</strong> E-Fatura gelen kutunuza düşen veya faturası sisteme işlenen alımların vade tarihleri (son ödeme günleri) ajandanıza otomatik olarak **Ödeme Hatırlatması** şeklinde kırmızı etiketle yansır. Böylece tedarikçi ödemelerinizi atlamazsınız.</li>
              <li><strong>Sistem İçi Yapılacak İşler (To-Do List):</strong> Kendinize veya sorumluluğunuzdaki personellere gün bazlı tamamlanması gereken görevler (Örn: "Cari bakiyesini sorgula", "Siparişi kargola") tanımlayabilir, tamamlandığında üzerine tik atarak progress'i izleyebilirsiniz.</li>
              <li><strong>Servisteki Periyodik Bakım Planlamaları:</strong> Teknik servis modülünde periyodik bakım aralığı tanımlanmış olan sözleşmeli jeneratör, asansör, klima vb. makinelerin rutin kontrol tarihleri geldiğinde, ajandanıza otomatik olarak **Saha Servis Randevusu** olarak düşer.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 14. RAPORLAR (RAPORLAR) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'raporlar' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">14. Gelişmiş Finansal Hacim ve KDV Raporlama Modülü</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Mali müşavirinizin, yöneticilerin veya şirket sahiplerinin dilediği iki tarih aralığında vergi kırılımlarını, ciro trendlerini ve ödeme yöntemlerini analiz ettiği ihracat uyumlu raporlama panelidir.
            </p>

            {/* Portal Visual Mockup: Raporlar */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-55 p-3">
              <div className="bg-white border rounded-lg p-3 text-xs shadow-xs space-y-2">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="font-bold text-slate-800 text-[10px] uppercase">Aylık KDV Kırılım Konsolidasyon Raporu</span>
                  <span className="text-[9px] text-gray-400">Tarih Aralığı: 01.06.2026 - 30.06.2026</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between border-b py-1">
                    <span>%20 KDV Matrah Satışı:</span>
                    <strong className="font-mono text-gray-700">₺154,000.00 (KDV: ₺30,800.00)</strong>
                  </div>
                  <div className="flex justify-between border-b py-1">
                    <span>%10 KDV Matrah Satışı:</span>
                    <strong className="font-mono text-gray-700">₺82,500.00 (KDV: ₺8,250.00)</strong>
                  </div>
                  <div className="flex justify-between border-b py-1">
                    <span>%1 KDV Matrah Satışı:</span>
                    <strong className="font-mono text-gray-700">₺12,000.00 (KDV: ₺120.00)</strong>
                  </div>
                  <div className="flex justify-between py-1 bg-slate-50 font-bold px-2 rounded mt-2 text-slate-800 text-[11px]">
                    <span>Kümülâtif Toplam Hasılat:</span>
                    <strong className="font-mono">₺248,500.00 (Vergi: ₺39,170.00)</strong>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">14.1 Excel / CSV Akıcı İhracat Standardı</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Tüm finansal rapor tabloları, filtrelediğiniz kriterlerle tek tıkla **XLSX (Microsoft Excel)** formatına birebir hücre kayması olmadan dışa aktarılır. Mali müşavirinize beyanname dönemlerinde e-posta ile gönderilerek iş hızı kazandırılır. Raporlar her işlem esnasında arka planda çalışan matematik motorları yardımıyla anlık kümüle edilerek raporlanır.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">14.2 İşlem Görmeyen Ürünler (Ölü Stok Raporu)</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              İşletmenizin devir hızını artırmak ve atıl sermayeyi çözmek için geliştirilen **İşlem Görmeyen Ürünler** raporu:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Rafta Bekleyen Stok Tespiti:</strong> Belirli tarihler arasında (Örn: son 6 ay) hiç satış görmemiş ve depolarda boş yer kaplayan ürünleri satın alma tarihleri ve toplam maliyet değerleriyle listeler.</li>
              <li><strong>Kampanya ve Sipariş Aksiyonu:</strong> Bu listenin tespiti sayesinde ölü stoklar için hızlıca iskonto/kampanya adımı planlayabilir veya gereksiz yeni alımları durdurabilirsiniz.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">14.3 Gelişmiş Cari Raporları ve Finansal Yaşlandırma</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Müşteri ve alacak portföyünüzün sağlığını denetlemeye yarayan konsolide **Cari Hesap Raporları**:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Bakiye Yaşalandırma:</strong> Alacakların ne kadar süredir tahsil edilmediğini (30, 60, 90+ gün) sınıflandırarak riskli cari hesapları listeler.</li>
              <li><strong>Cari Karlılık Analizi:</strong> Seçilen iki tarih arasında hangi müşterinin toplamda ne kadarlık ciro bıraktığı ve onlara ortalama uygulanan iskonto oranlarını listeler.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">14.4 Kapsamlı Ürün Satış ve Kar-Zarar Raporları</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Satış grafiklerinizi ve envanter kârlılığını rasyonel olarak ölçen **Ürün Envanter Raporları**:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>En Çok/En Az Satan Ürünler:</strong> Adet bazında en hızlı sirküle olan ürünleri ve kümülatif getiri hacimlerini azalan sırada listeler.</li>
              <li><strong>Maliyet Ölçümlü Brüt Kar Analizi:</strong> Satış faturalarındaki değerler ile o ürünlerin ortalama/son alış maliyetlerini karşılaştırarak, ürün bazlı brüt kar-zarar yüzdesini tam olarak raporlar.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 15. TEKLİF YÖNETİMİ (TEKLİF) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'teklif' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileBadge className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">15. Teklif Hazırlama ve İnteraktif Müşteri Bulut linki</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Müşterilerinize şık fiyat teklifleri hazırlayan, teklif durumlarını aşama aşama (Bekliyor, Onaylandı, Reddedildi) izleyen ve müşterinin önüne online şifreli web linki çıkaran interaktif satış teklif modülüdür.
            </p>

            {/* Portal Visual Mockup: Teklif */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-800">Teklif Bulut Paylaşım Linki Sihirbazı</span>
                <span className="bg-emerald-600 text-white font-bold px-1.5 rounded">ETKİN</span>
              </div>
              
              <div className="bg-white border rounded p-3 text-xs space-y-3">
                <div className="bg-emerald-50 p-2.5 rounded border border-emerald-150 flex justify-between items-center">
                  <div className="text-[10px] text-emerald-900 leading-normal">
                    <p className="m-0 font-bold">Özel Güvenlikli Bulut Teklif Linki Üretildi:</p>
                    <p className="m-0 font-mono text-emerald-700 text-[9px] mt-0.5 select-all">https://cloud.esila.com/proposal/verify?token=e04b2a8d</p>
                  </div>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1 px-2 text-[9px] font-bold">LİNKİ KOPYALA</button>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">15.1 Online Teklif Kabulü ve Bildirim Motoru</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Teklifi oluşturup **Linki Kopyala** dediğinizde oluşan benzersiz ve şifreli adresi müşterinize ilettiğinizde, müşteri linke tıklayarak teklifin detaylarını, logolarını ve dipnotlarını görebilir. En alt kısımda bulunan **Onaylıyorum** veya **Reddediyorum** butonlarına bastığı an veritabanındaki teklif aşaması otomatik olarak "Onaylandı" durumuna dönüştürülür ve sizi yeni bir telefon trafiğinden bütünüyle kurtarır.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">15.2 Teklif Aşamasında Ürün Kontrolü ve Envanter Sorgusu</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Fiyat teklifi hazırlarken hatalı taahhüt vermenizi engellemek için sistem arka planda sıkı kontroller uygular:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Anlık Stok Seviyesi Denetimi:</strong> Teklif kalemlerini eklerken, o ürünlerin depodaki güncel fiziksel stok adetleri anlık listelenir. Stokta yetersiz olan ürünler için sarı renkli uyarı sembolü gösterilir.</li>
              <li><strong>Taban Fiyat ve Maliyet Bariyeri:</strong> Teklif edilen satış fiyatı ürünün en son alış maliyetinin altındaysa, sistem teklif hazırlayan personeli uyararak şirketin zararına satış yapılmasının önüne geçer.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">15.3 Teklif Onay Sonrası Otomatik Satışa Çevirme ve Stoktan Düşüş</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Buluttaki müşteriniz teklife onay verdikten sonra, idari iş yükünüz sıfıra indirilir:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Tek Tıkla Siparişe/Faturaya Dönüştürme:</strong> Yönetici "Onaylı" statüdeki teklifin yanındaki "Satışa Çevir" veya "Faturalandır" butonuna tıklar. Teklifteki tüm ürünler, adetler, iskontolar ve KDV oranları yeniden yazmaya gerek kalmadan doğrudan resmi faturaya veya sevk siparişine dönüştürülür.</li>
              <li><strong>Anlık Stoktan Düşüş:</strong> Dönüştürme işlemi tamamlandığı an, teklife konu olan emtiaların adetleri ilgili depodan otomatik olarak düşer, cari hesaba borç bakiye kalıcı olarak kaydedilir ve stok kontrol döngüsü tamamlanmış olur.</li>
            </ul>
          </section>

          {/* ========================================================= */}
          {/* 16. AYARLAR & SİSTEM YEDEKLEME (AYARLAR) */}
          {/* ========================================================= */}
          <section className={`section-block transition-opacity duration-200 ${activeSection === 'ayarlar' ? 'block' : 'hidden print:block print:mb-12 print:page-break-before'}`}>
            <div className="flex items-center gap-3 border-b-2 border-emerald-600 pb-3 mb-6">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <SettingsIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-805 my-0">16. Sistem Ayarları, SMTP & Kritik Kurtarma Yedekleme</h2>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Şirketinizin fatura alt-yazı genel şablonlarını, e-posta gönderimi sağlayan SMTP parametrelerini, SMS servis entegrasyonlarını kurup her saniye veritabanı kopyasını indiren sistem ayarları yönetimidir.
            </p>

            {/* Portal Visual Mockup: Ayarlar */}
            <div className="my-6 border border-gray-200 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between items-center text-[10px] text-gray-500 border-b pb-2 mb-3">
                <span className="font-bold uppercase text-emerald-850">Geri Yükleme & Bulut Kurtarma Yardımcısı</span>
                <span className="text-red-700 bg-red-50 px-1.5 rounded font-bold">Kritik Güvenlik Alanı</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-xs">
                <div className="bg-white border rounded p-3 text-center transition-shadow hover:shadow-xs">
                  <span className="font-bold text-emerald-800 block uppercase text-[10px] mb-1">Veritabanı Yedek Dosyası İndir</span>
                  <p className="text-[10px] text-gray-450 mb-2">Bütün şirket verilerinizi tek tıklamayla JSON olarak yerel bilgisayarınıza saklar.</p>
                  <button className="bg-emerald-600 text-white rounded p-1.5 px-3 font-bold text-[10px] inline-flex items-center gap-1.5"><DollarSign size={11} /> Şirket Yedeğini İndir (.json)</button>
                </div>
                <div className="bg-white border rounded p-3 text-center transition-shadow hover:shadow-xs">
                  <span className="font-bold text-rose-800 block uppercase text-[10px] mb-1">JSON Dosyasından Geri Yükle</span>
                  <p className="text-[10px] text-gray-450 mb-2">Olası çökme veya sistem arızasında son yedeğinizi yükleyerek sistemi kurtarır.</p>
                  <button className="bg-rose-600 text-white rounded p-1.5 px-3 font-bold text-[10px] inline-flex items-center gap-1.5"><DollarSign size={11} /> Yedek Dosyasını Yükle</button>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.1 Şirket Kurulumu ve Firma Bilgileri Yönetimi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Esila Ticari sisteminizin resmi evraklara döküm yapacak tüm yasal kimliği **Firma Bilgileri** altından yönetilir. Bu bölümde; şirket resmi unvanı, TCKN/Vergi Kimlik Numarası (VKN), tescilli ticari adres, aktif telefon hatları, yetkili e-posta adresleri ve fatura dips alanlarında müşterilere gösterilecek banka hesap IBAN bilgileri tek bir ekrandan merkezi olarak düzenlenir.
            </p>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.2 Kurumsal Logo Yönetimi</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Müşterilerinize giden her türlü basılı ve dijital dökümün kurumsal kimliğinizi yansıtması için tasarlanmış logo yerleşim motorudur:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Çok Amaçlı Logo Yükleme:</strong> Sisteme yüklediğiniz PNG veya JPEG formatındaki şeffaf yüksek çözünürlüklü logolar faturalarda, tekliflerde, mutabakat formlarında ve mobil sipariş çıktılarında otomatik olarak ölçeklenerek basılır.</li>
              <li><strong>Küçük Boyutlu Slip Logosu:</strong> Termal 80mm fiş yazıcılarında hızlı basılabilmesi için logonun siyah-beyaz (monochrome) optimize edilmiş hafif bir kopya ayarı da ayrıca bu alandan yönetilir.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.3 Fiş ve Donanım Yazıcı Ayarları</h3>
            <p className="text-sm text-gray-705 leading-relaxed">
              Hızlı perakende aşamasında kasiyerlerin donanım entegrasyonu dökümüdür:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Yazıcı Seçimi ve Bağlantı Protokolleri:</strong> USB, Ethernet/LAN, Bluetooth veya Seri Port (COM) üzerinden bağlı her marka 80mm ve 58mm termal slip rulo yazıcıları sisteme kolayca tanıtılır.</li>
              <li><strong>Kağıt Kesme ve Fiş Alt Bilgi Düzenleme:</strong> Satış tamamlandığında otomatik kağıt kesme mekanizmasının aktifleşmesi, fişin üstünde ve altında görüntülenecek özel müşteri teşekkür mesajları (Örn: "Bizi tercih ettiğiniz için teşekkür ederiz, iade süremiz 14 gündür.") bu menüden tasarlanır.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.4 E-Fatura Şablon Tasarım Ayarları (Esila E-Fatura)</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Esila E-Fatura entegrasyonu kapsamında müşterilerinize giden XML ve PDF fatura şablonlarının görsel görünümünü özelleştirmek için kullanılır:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Görsel Tasarım Şablonları:</strong> Hazır mizanpaj tasarımları içinden firmanıza en uygun olan tasarımı seçebilirsiniz. E-Faturada gösterilecek kurumsal renk paletini belirleyebilir, faturanın alt kısmına şirket içi kaşe ve ıslak imza görsellerini dijital olarak yerleştirebilirsiniz.</li>
              <li><strong>Banka Hesap Yerleşimleri:</strong> Havale/EFT ile ödeme alabilmek için faturanın dipnot alanında liste halinde çıkacak aktif banka bilgilerini ve şube kodlarını şablon üzerine yerleştirebilirsiniz.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.5 Belge ve Sayaç Numaralandırma Hizmetleri</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Oluşturulan yasal belgelerin takip serileridir:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Özel Ön Ek Yönetimi:</strong> Satış faturaları (Örn: ESL2026000000001), teklifler (Örn: TEK20260000001), sevk irsaliyeleri (Örn: IRS20260000001) ve servis formları (Örn: SRV20260000001) için dilediğiniz 3 haneli harf ön ekini ve yıl parametresini belirleyebilirsiniz.</li>
              <li><strong>Sıralı Sayaç Kontrolü:</strong> Belge numaralarının veritabanında sıralı bir şekilde ilerlemesini sağlayan otomatik sayaç ayarları, yıl sonu devirleri esnasında manuel olarak sıfırlanabilir veya güncellenebilir.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.6 Giden E-Posta (Mail SMTP) Şablon Düzenlemeleri</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Müşterilerinize giden bilgilendirici e-postaların kurumsal dilini ve mizanpajını özelleştiren SMTP ayar modülüdür:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Giden SMTP Sunucu Entegrasyonu:</strong> Şirketinize ait info@firmaniz.com veya benzeri kurumsal mail adreslerini barındıran SMTP sunucu bilgilerini (Host, Port, SSL, Kullanıcı Adı ve Şifre) girerek maillerin direkt şirket adınızla gitmesini sağlarsınız.</li>
              <li><strong>Zengin Gövde (HTML) Şablon Sihirbazı:</strong> Teklif Onay Mailleri, Cari Mutabakat Duyuruları, E-Fatura Sevkiyat Bildirimleri ve Şifre Sıfırlama mailleri için gönderilecek e-postaların başlıklarını, imza alanlarını ve gövde içerik metinlerini dilediğiniz gibi tasarlayabilirsiniz.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-800 mt-4">16.7 Otomatik Bulut Yedekleme ve Anlık Manuel Kurtarma</h3>
            <p className="text-sm text-gray-705 leading-relaxed">
              Esila Ticari envanter dökümünüz, finansal hareketleriniz ve yasal tüm arşiviniz yüksek güvenlik standartları altında koruma altına alınır:
            </p>
            <ul className="text-sm space-y-1.5 text-gray-650 pl-5 list-disc">
              <li><strong>Zaman Ayarlı Otomatik Yedekleme:</strong> Sistem, her gece saat **03:00'da** hiçbir personel müdahalesine gerek kalmadan tüm veritabanının şifreli ve sıkıştırılmış yedek kopyasını otomatik alarak güvenli AWS S3 veya Google Drive bulut depolarınıza depolar.</li>
              <li><strong>Anlık Manuel Yedekleme:</strong> Kritik bir güncelleme yapmadan veya dükkanı kapatmadan önce istediğiniz her an "Manuel Yedek Al" butonuna basarak, tüm verilerinizi içeren güncel bir `.json` yedek dosyasını anında yerel bilgisayarınıza indirebilirsiniz.</li>
              <li><strong>Yedekten Geri Kurtarma:</strong> Olası bir bilgisayar çökmesi durumunda indirdiğiniz en son `.json` dosyasını sisteme sürükleyip bırakarak şirketinizin tüm veri akışını saniyeler içerisinde kaldığı yerden kusursuz çalışacak şekilde kurtarabilirsiniz.</li>
            </ul>

            {/* Support footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col items-center text-center">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Esila Ticari Pro Otomasyonu - Versiyon 4.2</span>
              <p className="text-xs text-gray-500 m-1">Bulut veri tescili Esila Ticari kurumsal sözleşmesi kapsamında koruma altındadır.</p>
              <p className="text-[9px] text-gray-405 mt-1">Esila E-Fatura entegrasyon lisans ortağı tarafından tescil edilmiştir.</p>
            </div>
          </section>
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
