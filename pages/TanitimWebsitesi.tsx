import React, { useState } from 'react';
import {
  Download,
  Printer,
  ArrowLeft,
  Search,
  Check,
  Code2,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TanitimWebsitesiProps {
  onBack?: () => void;
}

interface ModuleDetail {
  index: string;
  code: string;
  route: string;
  category: 'satis' | 'finans' | 'stok' | 'kurumsal';
  categoryLabel: string;
  title: string;
  summary: string;
  features: string[];
  workflowSteps: string[];
  visualData: {
    windowTitle: string;
    windowMeta: string;
    kpis: { label: string; value: string; sub: string }[];
    rows: { col1: string; col2: string; col3: string; highlight?: 'emerald' | 'amber' | 'sky' | 'rose' }[];
    footerNote: string;
  };
}

const ALL_MODULES: ModuleDetail[] = [
  {
    index: '01',
    code: 'dashboard',
    route: '/dashboard',
    category: 'kurumsal',
    categoryLabel: 'Yönetim & Analitik',
    title: '01. Yönetim Paneli (Dashboard) ve Finansal Komuta Merkezi',
    summary:
      'İşletmenizin tüm finansal ve operasyonel verilerini tek ekranda birleştirir. Kasa ve banka mevcudu, toplam müşteri alacakları, tedarikçi borçları, stok envanter değeri, vadesi yaklaşan çek/senetler ve kritik stok uyarıları gerçek zamanlı olarak hesaplanır.',
    features: [
      'Gerçek Zamanlı KPI Kartları: Toplam Kasa & Banka, Cari Alacaklar, Tedarikçi Borçları ve Net Envanter Değeri.',
      'Nakit Akışı ve Satış Grafikleri: Aylık/haftalık tahsilat, ödeme ve satış trendlerinin görsel karşılaştırması.',
      'Kritik Stok ve Vade Alarm Merkezi: Minimum seviyenin altına düşen stoklar ile vadesi gelen ödemelerin otomatik listesi.',
      'Hızlı İşlem Kısayolları: Tek tıkla Hızlı Satış, Yeni Cari, Tahsilat Girişi, E-Fatura veya Mutabakat ekranlarına geçiş.'
    ],
    workflowSteps: ['Veri Toplama (/api/bootstrap)', 'Canlı Bakiye & Stok Hesaplama', 'Grafik & Uyarı Üretimi', 'Hızlı Aksiyon Yönlendirme'],
    visualData: {
      windowTitle: 'panel / genel-bakis',
      windowMeta: 'VKN: 1111111111 · Canlı Veri',
      kpis: [
        { label: 'Kasa & Banka', value: '₺1.482.950', sub: '4 Aktif Hesap' },
        { label: 'Toplam Alacak', value: '₺845.200', sub: '128 Cari Kart' },
        { label: 'Envanter Değeri', value: '₺2.190.000', sub: '1.840 Ürün' }
      ],
      rows: [
        { col1: 'Özkan Metal A.Ş. · Cari Tahsilat', col2: 'Merkez Banka', col3: '+₺24.500,00', highlight: 'emerald' },
        { col1: 'Kasa #01 · Perakende Hızlı Satış', col2: 'Nakit Kasa', col3: '+₺3.890,00', highlight: 'emerald' },
        { col1: 'Akdeniz Lojistik · Tedarikçi Ödemesi', col2: 'EFT Çıkışı', col3: '-₺12.000,00', highlight: 'rose' }
      ],
      footerNote: 'Klavye Kısayolu: Ctrl+H ile her ekrandan anında Yönetim Paneline dönülebilir.'
    }
  },
  {
    index: '02',
    code: 'hizlisatis',
    route: '/hizlisatis & /musteri-ekrani',
    category: 'satis',
    categoryLabel: 'Satış & POS',
    title: '02. Hızlı Satış (POS), Barkod Okuyucu ve Çift Ekran Müşteri Gösterimi',
    summary:
      'Market, mağaza ve toptan satış noktaları için saniyeler içinde barkodlu satış yapmayı sağlayan dokunmatik uyumlu POS ekranı. İkinci monitör (/musteri-ekrani) desteğiyle müşteriye okutulan ürünleri, fiyatları ve toplam tutarı canlı olarak gösterir.',
    features: [
      'Barkod & Dokunmatik Hızlı Sepet: Lazer barkod okuyucu ile anında ürün ekleme, adet/iskonto güncelleme ve görsel kategori filtreleme.',
      'Esnek Tahsilat Seçenekleri: Nakit, Kredi Kartı, Banka Havalesi, Veresiye (Cari Hesaba Borç Yazma) ve Parçalı Ödeme.',
      'Canlı Müşteri Ekranı (/musteri-ekrani): Kasadaki ikinci ekranda sepetteki kalemleri, ara toplamı ve para üstünü anlık senkronize eder.',
      'Sepet Bekletme (Askıya Alma) & Termal Fiş: Sıradaki müşteriyi bekletmeden sepeti askıya alma ve termal satış fişi yazdırma.'
    ],
    workflowSteps: ['Barkod Okutma / Ürün Seçimi', 'İkinci Ekranda Canlı Gösterim', 'Nakit / Kart / Cari Tahsilat', 'Otomatik Stok Düşümü & Kasa Kaydı'],
    visualData: {
      windowTitle: 'pos / hizli-satis-terminali',
      windowMeta: 'Barkod: 8690123456789 · Çift Ekran Aktif',
      kpis: [
        { label: 'Aktif Sepet', value: '3 Kalem', sub: '8 Ürün Adedi' },
        { label: 'Ara Toplam', value: '₺3.500,00', sub: 'KDV: ₺350,00' },
        { label: 'Genel Toplam', value: '₺3.850,00', sub: 'Nakit / Kart / Veresiye' }
      ],
      rows: [
        { col1: '2x Endüstriyel Sensör Modülü', col2: 'Birim: ₺1.200,00', col3: '₺2.400,00', highlight: 'sky' },
        { col1: '1x Güç Adaptörü 24V 10A', col2: 'Birim: ₺850,00', col3: '₺850,00', highlight: 'sky' },
        { col1: '5x Yanmaz Montaj Kablosu', col2: 'Birim: ₺120,00', col3: '₺600,00', highlight: 'emerald' }
      ],
      footerNote: 'Müşteri Ekranı (/musteri-ekrani) ayrı sekmede veya ikinci monitörde gerçek zamanlı çalışır.'
    }
  },
  {
    index: '03',
    code: 'cariler',
    route: '/cariler',
    category: 'finans',
    categoryLabel: 'Finans & Cari',
    title: '03. Cariler (Müşteri ve Tedarikçi Hesap Yönetimi & PDF Ekstre)',
    summary:
      'Tüm müşteri ve tedarikçilerinizin borç, alacak ve net bakiye durumlarını detaylı hareket geçmişiyle yönetin. Tek tıkla A4 formatında Cari Hesap Ekstresi PDF dosyası indirin veya doğrudan müşterinin e-posta adresine otomatik gönderin.',
    features: [
      'Tahsilat ve Ödeme İşlemleri: Cari karta nakit, banka veya kredi kartı üzerinden tahsilat/ödeme işleme ve makbuz basımı.',
      'A4 PDF Cari Hesap Ekstresi: Tarih aralıklı tüm fatura, satış, tahsilat ve ödeme hareketlerini içeren resmi PDF ekstre.',
      'Otomatik E-Posta, SMS ve WhatsApp: Cari bakiye özetini ve ekstreyi tek tıkla müşteriye e-posta, SMS veya WhatsApp ile iletme.',
      'Detaylı Kurumsal Kimlik: Vergi Dairesi, VKN/TCKN, Risk Limiti, Özel İskonto Oranı ve İl/İlçe adres tanımları.'
    ],
    workflowSteps: ['Cari Kart Açılışı (VKN/TCKN)', 'Satış / Alış / Tahsilat Hareketi', 'Anlık Bakiye Hesaplama', 'PDF Ekstre & E-Posta Gönderimi'],
    visualData: {
      windowTitle: 'cariler / hesap-ekstresi',
      windowMeta: 'Toplam 162 Kayıtlı Cari · PDF & Mail',
      kpis: [
        { label: 'Toplam Borçlu Cari', value: '₺845.200', sub: 'Müşteri Alacaklarımız' },
        { label: 'Toplam Alacaklı Cari', value: '₺312.400', sub: 'Tedarikçi Borçlarımız' },
        { label: 'Net Cari Pozisyon', value: '+₺532.800', sub: 'Artı Bakiye' }
      ],
      rows: [
        { col1: 'Anadolu Endüstri A.Ş. (VKN: 1234567890)', col2: 'İstanbul / Tuzla', col3: '₺142.500,00 Borç', highlight: 'emerald' },
        { col1: 'Marmara Tedarik Ltd. (VKN: 9876543210)', col2: 'Bursa / Nilüfer', col3: '₺48.200,00 Alacak', highlight: 'rose' },
        { col1: 'Delta Mühendislik San. Tic.', col2: 'Ankara / Ostim', col3: '₺84.000,00 Borç', highlight: 'emerald' }
      ],
      footerNote: 'Her cari satırından doğrudan PDF Ekstre indirilebilir veya E-Posta ile ekstre gönderilebilir.'
    }
  },
  {
    index: '04',
    code: 'mutabakat',
    route: '/mutabakat & /mutabakat-onay/:id',
    category: 'finans',
    categoryLabel: 'Finans & E-Belge',
    title: '04. Online Onaylı Mutabakat, Geçmiş Tablosu, Toplu PDF ve Hatırlatıcı',
    summary:
      'VUK 329 kapsamında müşteri ve tedarikçilerinizle cari bakiye mutabakatlarınızı elektronik ortamda gerçekleştirin. Gönderilen e-posta veya SMS içindeki özel bağlantı ile karşı taraf şifresiz olarak mutabakatı onaylar veya reddeder; yanıtı anında ekranınıza düşer.',
    features: [
      'Tekli ve Toplu Mutabakat Gönderimi: Tüm carilere veya seçili cariye otomatik bakiye hesaplamalı mutabakat mektubu gönderimi.',
      'Canlı Online Onay / Red (/mutabakat-onay/:id): Müşteri onay veya red verdiğinde açıklama notuyla birlikte tabloya anında yansır.',
      'Mutabakat Geçmişi Tablosu: Gönderilmiş tüm mutabakatların durumu (Bekliyor, Onaylandı, Reddedildi), gönderim ve yanıt zamanları.',
      'Tek Tıkla "Hatırlatıcı Gönder" & "Tekrar Gönder": Bekleyen mutabakatlar için ilgili cariye tek tıkla otomatik hatırlatma e-postası gönderme.',
      'Seçili Mutabakatları Toplu PDF İndirme & Yazdırma: Çoklu seçim kutularıyla seçilen mutabakatları tek seferde çok sayfalı A4 PDF olarak indirme.'
    ],
    workflowSteps: ['Mutabakat Oluştur & E-Posta/SMS Gönder', 'Bekleyenlere Tek Tıkla Hatırlatıcı Gönder', 'Müşteri Online Onay / Red Verir', 'Mutabakat Geçmişinden Toplu PDF İndir'],
    visualData: {
      windowTitle: 'mutabakat / mutabakat-gecmisi-ve-pdf',
      windowMeta: 'Seçili Kayıtları Toplu PDF İndir · Hatırlatıcı Gönder',
      kpis: [
        { label: 'Onaylanan', value: '94 Mutabakat', sub: 'Online Teyitli' },
        { label: 'Bekleyen', value: '14 Mutabakat', sub: 'Hatırlatıcı Gönderilebilir' },
        { label: 'Reddedilen', value: '2 Mutabakat', sub: 'Ekstre İncelemesinde' }
      ],
      rows: [
        { col1: '☑ Delta Mühendislik · ₺84.000,00 (Borç)', col2: 'Durum: Bekliyor', col3: '[Hatırlatıcı Gönder] [Tekrar Gönder]', highlight: 'amber' },
        { col1: '☑ Kuzey Kimya A.Ş. · ₺19.500,00 (Borç)', col2: 'Durum: Onaylandı', col3: '[PDF İndir] [Tekrar Gönder]', highlight: 'emerald' },
        { col1: '☐ Боğaziçi Yapı Ltd. · ₺32.100,00 (Alacak)', col2: 'Durum: Reddedildi', col3: 'Not: "Fatura #412 eksik"', highlight: 'rose' }
      ],
      footerNote: 'Mutabakat Geçmişi tablosunda seçilen tüm satırlar tek seferde resmi A4 Mutabakat Mektubu PDF dosyası olarak indirilir.'
    }
  },
  {
    index: '05',
    code: 'efatura',
    route: '/efatura',
    category: 'finans',
    categoryLabel: 'Finans & E-Belge',
    title: '05. E-Fatura ve E-Arşiv Entegrasyon Merkezi',
    summary:
      'GİB / Entegratör altyapısıyla tam uyumlu çalışan E-Fatura ve E-Arşiv modülü. Gelen alış faturalarını tek ekran üzerinden görüntüleyin, içindeki cari ve stok kalemlerini otomatik olarak sisteminize aktarın; satışlarınızı resmi E-Fatura olarak gönderin.',
    features: [
      'Gelen E-Fatura Kutusu: Tedarikçilerden gelen faturaları listeleme, detaylı UBL-TR önizleme ve tek tıkla alış faturası olarak içeri alma.',
      'Giden E-Fatura & E-Arşiv: VKN/TCKN üzerinden otomatik mükellef sorgusu ile E-Fatura veya E-Arşiv ayrımı.',
      'Otomatik Cari & Ürün Eşleştirme: Gelen faturadaki yeni ürünleri ve tedarikçiyi veritabanına zahmetsizce kaydetme.'
    ],
    workflowSteps: ['Entegratör Senkronizasyonu', 'Gelen / Giden Fatura Kontrolü', 'Cari & Stok Otomatik Aktarım', 'Resmi UBL-TR / PDF Arşivleme'],
    visualData: {
      windowTitle: 'efatura / gelen-ve-giden-kutusu',
      windowMeta: 'UBL-TR 1.2 · GİB Entegrasyonu',
      kpis: [
        { label: 'Gelen Faturalar', value: '48 Adet', sub: 'Bu Ay' },
        { label: 'Giden E-Fatura', value: '112 Adet', sub: 'Ticari / Temel' },
        { label: 'Giden E-Arşiv', value: '86 Adet', sub: 'Bireysel / Kurumsal' }
      ],
      rows: [
        { col1: 'GIB2026000001842 · Yıldız Elektronik A.Ş.', col2: 'Gelen Ticari Fatura', col3: '₺54.280,00 · İçeri Alındı', highlight: 'emerald' },
        { col1: 'EAR2026000000914 · Boğaziçi Yapı Market', col2: 'Giden E-Arşiv Fatura', col3: '₺18.900,00 · Onaylandı', highlight: 'sky' }
      ],
      footerNote: 'Gelen E-Faturalardaki ürünler stok kartlarıyla eşleştirilerek tek tıkla depoya giriş yapılır.'
    }
  },
  {
    index: '06',
    code: 'urunler',
    route: '/urunler',
    category: 'stok',
    categoryLabel: 'Stok, Depo & Üretim',
    title: '06. Ürünler, Hizmet Kataloğu ve Barkod Etiket Basımı',
    summary:
      'Tüm ticari mal, hammadde, yarı mamul ve hizmet kartlarınızı stok kodu, barkod, kategori, alış/satış fiyatı, KDV oranı ve kritik stok seviyesiyle yönetin. Barkodu olmayan ürünler için otomatik barkod üretin ve raf/ürün etiketi yazdırın.',
    features: [
      'Otomatik Barkod & Raf Etiketi: Ürünler için barkod oluşturma ve termal yazıcıdan fiyat/barkod etiketi basma.',
      'Kritik Stok Seviyesi Takibi: Belirlenen alt sınırın altına inen ürünler için otomatik stok uyarısı.',
      'KDV, Birim ve Kategori Yönetimi: Adet, Kg, Metre, Litre, Koli birimleri ve çoklu kategori filtreleme.'
    ],
    workflowSteps: ['Ürün / Hizmet Kartı Tanımlama', 'Alış / Satış Fiyatı & KDV Girişi', 'Barkod Etiket Basımı', 'Depo Bazlı Stok İzleme'],
    visualData: {
      windowTitle: 'urunler / stok-katalogu',
      windowMeta: '1.840 Aktif Ürün Kartı · Barkod Üretici',
      kpis: [
        { label: 'Toplam Ürün Çeşidi', value: '1.840 SKU', sub: '14 Kategori' },
        { label: 'Kritik Stoktaki Ürün', value: '7 Ürün', sub: 'Sipariş Bekliyor' },
        { label: 'Barkod Kapsamı', value: '%100', sub: 'EAN-13 / Code128' }
      ],
      rows: [
        { col1: 'Endüstriyel Otomasyon Rölesi 24V (END-2044)', col2: 'Barkod: 8694421009123', col3: '145 Adet · ₺1.200,00', highlight: 'emerald' },
        { col1: 'Hidrolik Basınç Valfi DN25 (HID-1088)', col2: 'Barkod: 8694421009451', col3: '4 Adet (Kritik) · ₺4.500,00', highlight: 'amber' }
      ],
      footerNote: 'Her ürün kartından tek tıkla barkodlu raf ve ürün etiketi yazdırılabilir.'
    }
  },
  {
    index: '07',
    code: 'satislar',
    route: '/satislar',
    category: 'satis',
    categoryLabel: 'Satış & POS',
    title: '07. Kurumsal Satışlar ve Faturalandırma',
    summary:
      'Müşterilerinize yapılan toptan ve kurumsal satışları kalem bazlı iskonto, KDV ve vade bilgileriyle kaydedin. Satış tamamlandığında stoklar otomatik düşer, müşteri cari hesabına borç işlenir ve fatura çıktısı alınır.',
    features: [
      'Cari ve Stok Tam Entegrasyonu: Satış anında cari borçlandırma ve seçilen depodan otomatik stok düşümü.',
      'Peşin, Vadeli veya Kısmi Tahsilat: Satış esnasında peşinat alma ve kalan bakiyeyi vadeli bırakma.',
      'Fatura ve İrsaliye Çıktısı: Kurumsal satış formunu A4 PDF olarak indirme ve yazdırma.'
    ],
    workflowSteps: ['Müşteri & Depo Seçimi', 'Ürün Kalemleri ve İskonto Girişi', 'Cari Borç & Stok Düşümü', 'Fatura / E-Fatura Basımı'],
    visualData: {
      windowTitle: 'satislar / fatura-listesi',
      windowMeta: 'Otomatik Cari & Depo Entegrasyonu',
      kpis: [
        { label: 'Aylık Satış Hacmi', value: '₺1.240.800', sub: '186 Satış Fişi' },
        { label: 'Tahsilat Oranı', value: '%82.4', sub: 'Peşin + Havale' },
        { label: 'Ortalama Sepet', value: '₺6.670', sub: 'Kurumsal Satış' }
      ],
      rows: [
        { col1: 'SAT-2026-0891 · Özkan Metal A.Ş.', col2: 'Vadeli (30 Gün)', col3: '₺46.800,00', highlight: 'emerald' },
        { col1: 'SAT-2026-0892 · Tekno Sistem Ltd.', col2: 'Banka Havalesi', col3: '₺12.450,00', highlight: 'sky' }
      ],
      footerNote: 'Satış kayıtları tek tıkla E-Fatura modülüne aktarılabilir.'
    }
  },
  {
    index: '08',
    code: 'siparisler',
    route: '/siparisler',
    category: 'satis',
    categoryLabel: 'Satış & POS',
    title: '08. Müşteri Siparişleri ve Sevkiyat Süreç Yönetimi',
    summary:
      'Müşterilerden alınan siparişleri hazırlık aşamasından teslimata kadar adım adım izleyin. Onaylanan ve hazırlanan siparişi yeniden veri girmeden tek tıkla satış faturasına dönüştürün.',
    features: [
      'Sipariş Durum Takibi: Bekliyor, Hazırlanıyor, Kargoda, Teslim Edildi ve İptal Edildi statüleri.',
      'Tek Tıkla Satışa Dönüştürme: Sipariş kalemlerini otomatik olarak satış faturasına ve cari hesaba aktarma.',
      'Depo Hazırlık ve Sipariş Formu: Sevkiyat ekibi için ürün toplama ve sipariş fişi yazdırma.'
    ],
    workflowSteps: ['Sipariş Kaydı', 'Depo Hazırlık & Kontrol', 'Sevkiyat / Kargo', 'Tek Tıkla Satış Faturasına Dönüştür'],
    visualData: {
      windowTitle: 'siparisler / sevkiyat-takibi',
      windowMeta: 'Aktif Sipariş Havuzu',
      kpis: [
        { label: 'Hazırlanan Sipariş', value: '12 Adet', sub: 'Depo Sürecinde' },
        { label: 'Sevk Edilen', value: '64 Adet', sub: 'Bu Ay' },
        { label: 'Sipariş Tutarı', value: '₺418.900', sub: 'Toplam Açık Sipariş' }
      ],
      rows: [
        { col1: 'SIP-1042 · Anadolu Endüstri A.Ş.', col2: 'Durum: Hazırlanıyor', col3: '8 Kalem · ₺31.200,00', highlight: 'amber' },
        { col1: 'SIP-1041 · Kuzey Kimya A.Ş.', col2: 'Durum: Teslim Edildi', col3: '4 Kalem · ₺15.900,00', highlight: 'emerald' }
      ],
      footerNote: 'Sipariş teslim edildiğinde tek butonla stoktan düşülerek faturalandırılır.'
    }
  },
  {
    index: '09',
    code: 'satinalma',
    route: '/satinalma',
    category: 'stok',
    categoryLabel: 'Stok, Depo & Üretim',
    title: '09. Satın Alma, Tedarikçi Siparişleri ve Mal Kabul',
    summary:
      'Tedarikçilerden yapılan tüm mal ve hammadde alımlarını kayıt altına alın. Satın alma faturası girildiğinde ilgili ürünler otomatik olarak depoya eklenir ve tedarikçi cari hesabına alacak kaydedilir.',
    features: [
      'Otomatik Depo Stok Girişi: Alınan ürünlerin seçilen depoya anında eklenmesi.',
      'Alış Fiyatı ve Maliyet Güncelleme: Ürün kartlarındaki son alış maliyetlerinin otomatik güncellenmesi.',
      'Tedarikçi Bakiye Takibi: Alış faturasının tedarikçi ekstresine otomatik alacak olarak işlenmesi.'
    ],
    workflowSteps: ['Tedarikçi Seçimi', 'Alınan Ürün & Fiyat Girişi', 'Depoya Otomatik Stok Girişi', 'Tedarikçi Cari Alacak Kaydı'],
    visualData: {
      windowTitle: 'satinalma / mal-kabul',
      windowMeta: 'Tedarik & Alış Faturaları',
      kpis: [
        { label: 'Aylık Alım', value: '₺615.000', sub: '42 Alış Fişi' },
        { label: 'Aktif Tedarikçi', value: '34 Firma', sub: 'Düzenli Tedarik' },
        { label: 'Depo Girişi', value: '+4.850 Adet', sub: 'Bu Ay' }
      ],
      rows: [
        { col1: 'ALM-409 · Marmara Tedarik Ltd.', col2: 'Merkez Depo Girişi', col3: '₺64.200,00', highlight: 'sky' },
        { col1: 'ALM-408 · Avrasya Çelik Sanayi', col2: 'Hammadde Depo Girişi', col3: '₺128.000,00', highlight: 'emerald' }
      ],
      footerNote: 'Satın alma kayıtları ürün birim maliyetlerini otomatik besler.'
    }
  },
  {
    index: '10',
    code: 'uretim',
    route: '/uretim',
    category: 'stok',
    categoryLabel: 'Stok, Depo & Üretim',
    title: '10. Üretim Yönetimi, Ürün Reçeteleri (BOM) ve İmalat Emirleri',
    summary:
      'Üretim yapan işletmeler için reçete (Bill of Materials) ve üretim emri otomasyonu. Bir mamulün üretimi tamamlandığında reçetesindeki hammaddeler stoktan otomatik düşer, üretilen mamul stoğa girer ve birim maliyet hesaplanır.',
    features: [
      'Ürün Reçetesi (BOM) Tanımlama: Mamul başına tüketilecek hammadde miktarları, birimleri ve fire oranları.',
      'Hammadde Yeterlilik Kontrolü: Üretim emri verilmeden önce depodaki hammadde stoklarının kontrol edilmesi.',
      'Tam Otomatik Stok Dönüşümü: Hammadde sarfiyatı ve mamul girişinin tek işlemle gerçekleşmesi.'
    ],
    workflowSteps: ['Ürün Reçetesi (BOM) Oluştur', 'Üretim Emri Başlat', 'Hammadde Stoktan Düşer', 'Mamul Stoğa Girer & Maliyet Hesaplanır'],
    visualData: {
      windowTitle: 'uretim / recete-ve-imalat-emirleri',
      windowMeta: 'BOM (Bill of Materials) Otomasyonu',
      kpis: [
        { label: 'Tanımlı Reçete', value: '38 Mamul', sub: 'Aktif BOM' },
        { label: 'Tamamlanan Emir', value: '24 Üretim', sub: 'Bu Ay' },
        { label: 'Üretilen Mamul', value: '1.450 Adet', sub: 'Sıfır Stok Hatası' }
      ],
      rows: [
        { col1: 'UE-2026-19 · Otomasyon Panosu 400V', col2: '50 Adet Üretildi', col3: 'Birim Maliyet: ₺3.420,00', highlight: 'emerald' },
        { col1: 'UE-2026-20 · Hidrolik Güç Ünitesi', col2: 'Üretimde (%65)', col3: '12 Kalem Hammadde', highlight: 'amber' }
      ],
      footerNote: 'Reçetedeki hammadde alış fiyatları değiştikçe mamul üretim maliyeti dinamik hesaplanır.'
    }
  },
  {
    index: '11',
    code: 'depo',
    route: '/depo',
    category: 'stok',
    categoryLabel: 'Stok, Depo & Üretim',
    title: '11. Çoklu Depo Yönetimi ve Depolar Arası Stok Transferi',
    summary:
      'Merkez depo, şube depoları, üretim deposu veya saha araç depolarını ayrı ayrı yönetin. Depolar arası transfer fişleriyle stoklarınızın lokasyon bazlı dağılımını gerçek zamanlı takip edin.',
    features: [
      'Sınırsız Depo ve Lokasyon Tanımı: Her şube veya depo sorumlusu için ayrı envanter takibi.',
      'Depolar Arası Transfer Fişleri: Kaynak depodan düşüm ve hedef depoya eşzamanlı stok girişi.',
      'Depo Bazlı Stok Değer Raporu: Hangi depoda ne kadarlık ürün bulunduğunun anlık analizi.'
    ],
    workflowSteps: ['Depo / Şube Tanımla', 'Kaynak ve Hedef Depo Seç', 'Transfer Miktarını Gir', 'Anlık Depo Stok Güncellemesi'],
    visualData: {
      windowTitle: 'depo / coklu-depo-ve-transfer',
      windowMeta: '3 Aktif Depo · Anlık Transfer',
      kpis: [
        { label: 'Merkez Depo', value: '₺1.420.000', sub: 'İstanbul / Merkez' },
        { label: 'Şube Depo', value: '₺540.000', sub: 'Ankara / Bölge' },
        { label: 'Hammadde Depo', value: '₺230.000', sub: 'Üretim Sahası' }
      ],
      rows: [
        { col1: 'TRF-209 · Merkez Depo → Ankara Şube', col2: '45 Adet Sensör Modülü', col3: 'Transfer Tamamlandı', highlight: 'emerald' },
        { col1: 'TRF-210 · Hammadde Depo → Üretim', col2: '120 Mt Bakır Kablo', col3: 'Transfer Tamamlandı', highlight: 'sky' }
      ],
      footerNote: 'Her ürünün hangi depoda kaç adet bulunduğu ürün kartı içinde ayrı ayrı listelenir.'
    }
  },
  {
    index: '12',
    code: 'sayim',
    route: '/sayim',
    category: 'stok',
    categoryLabel: 'Stok, Depo & Üretim',
    title: '12. Barkodlu Fiziksel Stok Sayım ve Fark Eşitleme',
    summary:
      'El terminali, barkod okuyucu veya mobil cihazlarla depo sayımınızı hızla tamamlayın. Sistemde görünen stok ile fiziksel sayım arasındaki farkları görüntüleyin ve tek tıkla envanterinizi eşitleyin.',
    features: [
      'Barkod Okutarak Hızlı Sayım: Okutulan her barkodun sayım listesine otomatik eklenmesi.',
      'Sayım Fazlası / Sayım Eksiği Raporu: Sistem stoğu ile sayılan miktar arasındaki farkların parasal ve miktarsal analizi.',
      'Tek Tıkla Envanter Eşitleme: Sayım sonucu onaylandığında ürün stoklarının gerçek miktara güncellenmesi.'
    ],
    workflowSteps: ['Sayım Oturumu Başlat', 'Barkod Okut / Miktar Gir', 'Fark Raporunu İncele', 'Stokları Otomatik Eşitle'],
    visualData: {
      windowTitle: 'sayim / fiziksel-envanter-kontrolu',
      windowMeta: 'Barkodlu Sayım Modu',
      kpis: [
        { label: 'Sayılan Kalem', value: '412 Ürün', sub: 'Merkez Depo' },
        { label: 'Tam Uyumlu', value: '405 Ürün', sub: '%98.3 Doğruluk' },
        { label: 'Fark Bulunan', value: '7 Ürün', sub: 'Eşitlemeye Hazır' }
      ],
      rows: [
        { col1: 'END-2044 · Otomasyon Rölesi', col2: 'Sistem: 145 | Sayım: 145', col3: 'Fark: 0 (Tam Uyum)', highlight: 'emerald' },
        { col1: 'KAB-1012 · Montaj Kablosu', col2: 'Sistem: 80 | Sayım: 78', col3: 'Fark: -2 Adet', highlight: 'amber' }
      ],
      footerNote: 'Sayım geçmişi arşivlenir ve istenildiği zaman PDF olarak raporlanabilir.'
    }
  },
  {
    index: '13',
    code: 'kasa',
    route: '/kasa',
    category: 'finans',
    categoryLabel: 'Finans & Cari',
    title: '13. Kasa, Banka Hesapları ve Gelir / Gider Yönetimi',
    summary:
      'Nakit kasalarınızı, banka hesaplarınızı ve şirket kredi kartlarınızı tek merkezden takip edin. Tahsilatlar, ödemeler, genel giderler (kira, elektrik, vergi, maaş) ve kasalar arası virman işlemlerini anlık yönetin.',
    features: [
      'Çoklu Kasa & Banka Tanımı: TL, USD, EUR kasaları ve tüm banka IBAN hesaplarının bakiye kontrolü.',
      'Gelir & Gider Kategorizasyonu: İşletme giderlerinin kalem bazlı sınıflandırılması ve raporlanması.',
      'Gün Sonu Kasa Özeti: Devreden bakiye, günlük toplam giriş/çıkış ve net kasa mevcudu.'
    ],
    workflowSteps: ['Kasa / Banka Hesabı Seç', 'Gelir / Gider / Virman Kaydet', 'Cari veya Masraf Eşleştir', 'Günlük Kasa Raporu Al'],
    visualData: {
      windowTitle: 'kasa / nakit-ve-banka-akisi',
      windowMeta: 'Çoklu Hesap & Virman',
      kpis: [
        { label: 'Merkez Nakit Kasa', value: '₺184.500', sub: 'Gün İçi +₺18.400' },
        { label: 'Banka Hesapları', value: '₺1.298.450', sub: '3 Banka Hesabı' },
        { label: 'Aylık Gider', value: '₺94.200', sub: 'Kira, Enerji, Lojistik' }
      ],
      rows: [
        { col1: 'Giriş · Cari Tahsilat (Özkan Metal)', col2: 'Vakıf Katılım Hesabı', col3: '+₺24.500,00', highlight: 'emerald' },
        { col1: 'Çıkış · Fabrika Elektrik Faturası', col2: 'Genel Gider', col3: '-₺14.800,00', highlight: 'rose' }
      ],
      footerNote: 'Tüm satış ve cari tahsilat işlemleri seçilen kasa/banka bakiyesini otomatik günceller.'
    }
  },
  {
    index: '14',
    code: 'ceksenet',
    route: '/ceksenet',
    category: 'finans',
    categoryLabel: 'Finans & Cari',
    title: '14. Çek ve Senet Portföyü, Ciro ve Vade Takibi',
    summary:
      'Müşterilerden alınan çek/senetleri ve kendi keşide ettiğiniz evrakları vade takvimiyle yönetin. Portföydeki müşteri çekini tedarikçiye ciro edin, bankaya tahsile verin veya tahsilatını kasaya işleyin.',
    features: [
      'Müşteri Çeki & Kendi Çekimiz Ayrımı: Alınan ve verilen tüm kıymetli evrakların vade ve banka bilgileri.',
      'Ciro ve Banka Tahsil Süreci: Portföydeki evrakı başka bir cariye ciro etme veya bankaya gönderme.',
      'Vade Takvimi ve Uyarılar: Vadesi yaklaşan veya günü gelen çek/senetlerin otomatik takibi.'
    ],
    workflowSteps: ['Çek / Senet Girişi', 'Portföyde Takip', 'Tedarikçiye Ciro veya Bankaya Tahsil', 'Bakiye Kapatma'],
    visualData: {
      windowTitle: 'ceksenet / portfoy-yonetimi',
      windowMeta: 'Vade & Ciro Takibi',
      kpis: [
        { label: 'Portföydeki Çekler', value: '₺340.000', sub: '6 Adet Evrak' },
        { label: 'Ciro Edilen', value: '₺185.000', sub: 'Tedarikçilere Verilen' },
        { label: 'Kendi Çeklerimiz', value: '₺110.000', sub: 'Ödeme Bekleyen' }
      ],
      rows: [
        { col1: 'Çek #784120 · Keşideci: Anadolu A.Ş.', col2: 'Vade: 15.11.2026', col3: 'Portföyde · ₺95.000,00', highlight: 'sky' },
        { col1: 'Çek #651904 · Ciro: Marmara Tedarik', col2: 'Vade: 30.11.2026', col3: 'Ciro Edildi · ₺42.000,00', highlight: 'amber' }
      ],
      footerNote: 'Çek tahsil edildiğinde veya ciro edildiğinde ilgili cari ve banka hesapları otomatik güncellenir.'
    }
  },
  {
    index: '15',
    code: 'teklif',
    route: '/teklif & /teklif-onay/:id',
    category: 'satis',
    categoryLabel: 'Satış & POS',
    title: '15. Fiyat Teklifleri (Proforma) ve Online Müşteri Onayı',
    summary:
      'Müşterilerinize dakikalar içinde şık ve kurumsal fiyat teklifleri hazırlayın. Teklifi PDF olarak indirin veya müşterinize özel Online Teklif Onay bağlantısıyla gönderin; onaylanan teklifi tek tıkla siparişe veya satışa dönüştürün.',
    features: [
      'Online Teklif Onay Sayfası (/teklif-onay/:id): Müşterinin teklifi web üzerinden inceleyip tek tıkla onaylaması.',
      'Profesyonel A4 Proforma PDF: Firma logosu, banka IBAN bilgileri, teslimat ve ödeme şartlarını içeren çıktı.',
      'Tek Tıkla Siparişe / Satışa Aktarım: Onaylanan teklif kalemlerini yeniden yazmadan faturaya dönüştürme.'
    ],
    workflowSteps: ['Teklif Hazırla & PDF Üret', 'Müşteriye Online Link Gönder', 'Müşteri Online Onaylar', 'Siparişe / Satışa Dönüştür'],
    visualData: {
      windowTitle: 'teklifler / online-proforma-onay',
      windowMeta: 'Online Onay Linki Aktif',
      kpis: [
        { label: 'Açık Teklifler', value: '₺520.000', sub: '18 Proforma' },
        { label: 'Onaylanan Teklif', value: '₺310.000', sub: '%59 Dönüşüm Oranı' },
        { label: 'Satışa Dönüşen', value: '11 Teklif', sub: 'Bu Ay' }
      ],
      rows: [
        { col1: 'TKL-2026-312 · Fabrika Otomasyon Projesi', col2: 'Durum: Müşteri Onayladı', col3: '₺164.000,00', highlight: 'emerald' },
        { col1: 'TKL-2026-315 · Depo Raf Sistemleri', col2: 'Durum: Yanıt Bekliyor', col3: '₺38.500,00', highlight: 'amber' }
      ],
      footerNote: 'Müşteri teklifi online onayladığında sistemde durumu anında "Onaylandı" olarak güncellenir.'
    }
  },
  {
    index: '16',
    code: 'ariza',
    route: '/ariza',
    category: 'kurumsal',
    categoryLabel: 'İK, Servis & Yönetim',
    title: '16. Teknik Servis, Arıza Kabul Formları ve Online Durum Sorgulama',
    summary:
      'Teknik servis ve bakım hizmeti veren firmalar için uçtan uca cihaz kabul ve onarım takibi. Cihaz seri no, arıza tanımı, yapılan işlemler, kullanılan yedek parçalar ve servis ücretini yönetin; müşteriye online takip bağlantısı sunun.',
    features: [
      'Cihaz Kabul & Barkodlu Servis Fişi: Teslim alınan cihaz için detaylı servis formu ve barkodlu kabul belgesi.',
      'Müşteri Online Servis Takip Ekranı: Müşteriye gönderilen özel link ile cihazın onarım aşamasını canlı izleme.',
      'Otomatik E-Posta & SMS Bilgilendirme: Cihaz onarıldığında veya teslime hazır olduğunda müşteriye otomatik bildirim.'
    ],
    workflowSteps: ['Cihaz Kabul & Kayıt', 'Arıza Tespiti & Yedek Parça', 'Onarım Tamamlandı Bildirimi', 'Teslimat & Tahsilat'],
    visualData: {
      windowTitle: 'ariza / teknik-servis-yonetimi',
      windowMeta: 'Online Servis Takip Linki & E-Posta',
      kpis: [
        { label: 'Servisteki Cihaz', value: '9 Cihaz', sub: 'Aktif İş Emri' },
        { label: 'Teslime Hazır', value: '5 Cihaz', sub: 'Müşteriye Bildirildi' },
        { label: 'Tamamlanan Servis', value: '142 Kayıt', sub: 'Bu Dönem' }
      ],
      rows: [
        { col1: 'SRV-8094 · Endüstriyel El Terminali (SN: 99412)', col2: 'Durum: Teslime Hazır', col3: '₺2.400,00', highlight: 'emerald' },
        { col1: 'SRV-8095 · Termal Barkod Yazıcı', col2: 'Durum: Parça Bekliyor', col3: '₺1.150,00', highlight: 'amber' }
      ],
      footerNote: 'Servis formu şablonu ile müşteriye cihaz durumu hakkında kurumsal HTML e-posta gönderilir.'
    }
  },
  {
    index: '17',
    code: 'personel',
    route: '/personel',
    category: 'kurumsal',
    categoryLabel: 'İK, Servis & Yönetim',
    title: '17. Personel, Maaş, Avans, İzin ve Rol Bazlı Yetkilendirme (RBAC)',
    summary:
      'Çalışanlarınızın özlük bilgilerini, maaş tahakkuklarını, avans ve prim ödemelerini takip edin. Sistem kullanıcılarına modül bazında (Görüntüleme, Ekleme, Düzenleme, Silme) granüler erişim yetkileri tanımlayın.',
    features: [
      'Maaş, Avans ve Prim Hesabı: Personel cari bakiyesi, ödenen avanslar ve ay sonu kalan net maaş takibi.',
      'Modül Bazlı Yetki Matrisi (RBAC): Kasiyer, muhasebe, depo sorumlusu veya satış personeline özel ekran kısıtlamaları.',
      'İzin ve Görev Takibi: Personel işe giriş tarihi, departman ve iletişim kayıtları.'
    ],
    workflowSteps: ['Personel & Kullanıcı Tanımla', 'Modül Yetkilerini Ata', 'Maaş / Avans İşle', 'Kasa Gider Entegrasyonu'],
    visualData: {
      windowTitle: 'personel / ik-ve-yetki-matrisi',
      windowMeta: 'RBAC Granüler Yetkilendirme',
      kpis: [
        { label: 'Aktif Personel', value: '18 Çalışan', sub: '4 Departman' },
        { label: 'Sistem Kullanıcısı', value: '8 Hesap', sub: 'Rol Bazlı Yetkili' },
        { label: 'Aylık Maaş Bordro', value: '₺485.000', sub: 'Tamamı Ödendi' }
      ],
      rows: [
        { col1: 'Ahmet Yılmaz · Muhasebe Müdürü', col2: 'Yetki: Finans & E-Fatura', col3: 'Aktif Kullanıcı', highlight: 'emerald' },
        { col1: 'Selin Kaya · Satış & Kasa Sorumlusu', col2: 'Yetki: POS & Siparişler', col3: 'Aktif Kullanıcı', highlight: 'sky' }
      ],
      footerNote: 'Yetkisi olmayan kullanıcılar ilgili modülü menüde göremez ve işlem yapamaz.'
    }
  },
  {
    index: '18',
    code: 'crm',
    route: '/crm',
    category: 'satis',
    categoryLabel: 'Satış & POS',
    title: '18. CRM (Müşteri İlişkileri) ve Toplu SMS / E-Posta Kampanyaları',
    summary:
      'Potansiyel müşterilerinizi (Lead), telefon/ziyaret görüşme notlarınızı ve satış fırsatlarınızı yönetin. Mevcut veya potansiyel müşteri gruplarınıza özel gün, duyuru ve kampanya mesajlarını toplu SMS veya E-Posta ile iletin.',
    features: [
      'Potansiyel Müşteri (Lead) Havuzu: Aday müşterilerin sektörü, durumu ve görüşme geçmişi.',
      'Toplu SMS & Toplu E-Posta Gönderimi: Seçili müşteri listesine tek tıkla kurumsal duyuru ve kampanya gönderimi.',
      'Satış Hunisi (Pipeline) Takibi: İlk temas, teklif aşaması, müzakere ve kazanılan müşteri adımları.'
    ],
    workflowSteps: ['Potansiyel Müşteri Kaydı', 'Görüşme Notu & Takip', 'Toplu SMS / Mail Kampanyası', 'Aktif Cariye Dönüştürme'],
    visualData: {
      windowTitle: 'crm / musteri-iliskileri-ve-kampanya',
      windowMeta: 'Toplu SMS & E-Posta Motoru',
      kpis: [
        { label: 'Potansiyel Aday', value: '64 Firma', sub: 'Aktif Görüşmede' },
        { label: 'Kazanılan Müşteri', value: '19 Firma', sub: '%29.6 Dönüşüm' },
        { label: 'Gönderilen Kampanya', value: '1.250 Alıcı', sub: 'SMS & E-Posta' }
      ],
      rows: [
        { col1: 'Kampanya · 2026 Yıl Sonu İskonto Duyurusu', col2: 'Alıcı: 128 Cari', col3: 'E-Posta & SMS Gönderildi', highlight: 'emerald' },
        { col1: 'Aday · Ege Makina Sanayi', col2: 'Aşama: Teklif Sunuldu', col3: 'Potansiyel: ₺180.000', highlight: 'sky' }
      ],
      footerNote: 'CRM üzerinden kazanılan adaylar tek tıkla gerçek Cari Hesap kartına dönüştürülür.'
    }
  },
  {
    index: '19',
    code: 'raporlar',
    route: '/raporlar',
    category: 'kurumsal',
    categoryLabel: 'İK, Servis & Yönetim',
    title: '19. Gelişmiş Finansal ve Operasyonel Raporlar',
    summary:
      'İstediğiniz tarih aralığında işletmenizin satış karlılığını, gelir-gider dengesini, KDV durumunu, en çok satan ürünlerini ve cari bakiye yaşlandırmasını detaylı grafik ve tablolarla analiz edin.',
    features: [
      'Kar / Zarar ve Maliyet Analizi: Satış gelirleri, ürün alış maliyetleri ve işletme giderlerinin net karlılık özeti.',
      'KDV ve Fatura Raporu: Hesaplanan KDV, İndirilecek KDV ve ödenecek/devreden KDV simülasyonu.',
      'Excel ve PDF Dışa Aktarım: Tüm rapor tablolarını mali müşavirinizle paylaşmak üzere dışa aktarma.'
    ],
    workflowSteps: ['Tarih Aralığı & Filtre Seç', 'Veri Analizi & Grafik Üretimi', 'Kar/Zarar & KDV Hesaplama', 'PDF / Excel İndir'],
    visualData: {
      windowTitle: 'raporlar / finansal-analitik',
      windowMeta: 'Net Karlılık & KDV Özeti',
      kpis: [
        { label: 'Brüt Satış Karı', value: '₺384.600', sub: '%31.2 Kar Marjı' },
        { label: 'Net Dönem Karı', value: '₺290.400', sub: 'Giderler Düşülmüş' },
        { label: 'Net KDV Dengesi', value: '₺42.180', sub: 'Dönem Özeti' }
      ],
      rows: [
        { col1: 'Satış Karlılık Raporu (Ürün & Kategori Bazlı)', col2: 'Dönem: 2026', col3: 'PDF / Excel Hazır', highlight: 'emerald' },
        { col1: 'Cari Bakiye ve Tahsilat Performans Raporu', col2: '162 Cari Kart', col3: 'PDF / Excel Hazır', highlight: 'sky' }
      ],
      footerNote: 'Tüm modüllerdeki veriler anlık olarak raporlama motorunu besler.'
    }
  },
  {
    index: '20',
    code: 'ajanda',
    route: '/ajanda',
    category: 'kurumsal',
    categoryLabel: 'İK, Servis & Yönetim',
    title: '20. Kurumsal Ajanda, Hatırlatıcılar ve Sesli Not Sistemi',
    summary:
      'Ödeme ve tahsilat günlerini, müşteri randevularını ve şirket içi yapılacak işleri takvim üzerinde yönetin. Türkçe ses tanıma (Speech-to-Text) özelliğiyle klavye kullanmadan konuşarak notlarınızı yazdırın.',
    features: [
      'Takvim ve Görev Planlayıcı: Günlük, haftalık ve aylık kurumsal etkinlik ve ödeme takibi.',
      'Türkçe Sesle Yazdırma (Mikrofon): Not ve açıklama alanlarını konuşarak hızlıca doldurma.',
      'Öncelik ve Tamamlanma Durumu: Kritik hatırlatmaların renkli öncelik seviyeleriyle izlenmesi.'
    ],
    workflowSteps: ['Tarih & Saat Seç', 'Klavye veya Sesle Not Ekle', 'Öncelik Belirle', 'Tamamlandı Olarak İşaretle'],
    visualData: {
      windowTitle: 'ajanda / takvim-ve-sesli-notlar',
      windowMeta: 'Türkçe Ses Tanıma Aktif',
      kpis: [
        { label: 'Bugünkü Görevler', value: '4 Plan', sub: '2 TahsilatAraması' },
        { label: 'Bu Hafta', value: '15 Etkinlik', sub: 'Toplantı & Ödeme' },
        { label: 'Tamamlanan', value: '89 Görev', sub: 'Arşivlendi' }
      ],
      rows: [
        { col1: '14:00 · Özkan Metal Mutabakat ve Tahsilat Görüşmesi', col2: 'Yüksek Öncelik', col3: 'Bugün', highlight: 'amber' },
        { col1: '16:30 · KDV ve E-Fatura Kontrolü', col2: 'Finans Birimi', col3: 'Tamamlandı', highlight: 'emerald' }
      ],
      footerNote: 'Sistem genelindeki tüm açıklama alanlarında mikrofonla sesli yazdırma desteği bulunur.'
    }
  },
  {
    index: '21',
    code: 'dokumanlar',
    route: '/dokumanlar',
    category: 'kurumsal',
    categoryLabel: 'İK, Servis & Yönetim',
    title: '21. Dijital Arşiv ve Kurumsal Döküman Yönetimi',
    summary:
      'Şirket sözleşmelerini, vergi levhalarını, imza sirkülerini, banka dekontlarını ve teknik şartnameleri tek bir güvenli bulut arşivinde toplayın. İstediğiniz belgeye saniyeler içinde ulaşın ve önizleyin.',
    features: [
      'Kategorili Belge Arşivi: Sözleşmeler, Resmi Evraklar, Dekontlar, Kalite Belgeleri ve Personel Dosyaları.',
      'Hızlı Arama ve Etiketleme: Dosya adı, cari adı veya tarihe göre anında belge bulma.',
      'Anlık Önizleme ve İndirme: PDF ve görsel belgeleri uygulama içinden doğrudan görüntüleme.'
    ],
    workflowSteps: ['Belge Yükle', 'Kategori & Cari İlişkilendir', 'Bulut Arşivde Sakla', 'Anında Önizle / İndir'],
    visualData: {
      windowTitle: 'dokumanlar / dijital-arsiv',
      windowMeta: 'Kurumsal Evrak & Sözleşme Havuzu',
      kpis: [
        { label: 'Arşivlenen Belge', value: '324 Dosya', sub: 'PDF, Görsel, XLS' },
        { label: 'Klasör Yapısı', value: '6 Kategori', sub: 'Sözleşme & Resmi' },
        { label: 'Erişim Hızı', value: 'Anlık', sub: 'Bulut Senkronize' }
      ],
      rows: [
        { col1: '2026_Tedarik_Sozlesmesi_Anadolu_AS.pdf', col2: 'Kategori: Sözleşmeler', col3: '1.4 MB · İndir', highlight: 'emerald' },
        { col1: 'Vergi_Levhasi_ve_Imza_Sirkuleri_2026.pdf', col2: 'Kategori: Resmi Evrak', col3: '840 KB · İndir', highlight: 'sky' }
      ],
      footerNote: 'Fiziksel klasör karmaşasını ortadan kaldırarak tüm şirket evraklarını tek merkezde korur.'
    }
  },
  {
    index: '22',
    code: 'ayarlar',
    route: '/ayarlar & ?admin=true',
    category: 'kurumsal',
    categoryLabel: 'İK, Servis & Yönetim',
    title: '22. Sistem Ayarları, Güvenlik, Yedekleme ve Süper Admin Yönetimi',
    summary:
      'Firma unvanı, banka IBAN bilgileri, SMTP E-Posta sunucusu, SMS API, HTML e-posta şablonları ve veritabanı yedekleme işlemlerini yönetin. Süper Admin paneli ile çoklu firma (Multi-Tenant), Aylık/Yıllık lisans paketleri ve EFT ödeme bildirimlerini kontrol edin.',
    features: [
      'Genişletilmiş Kayıt Ol & EFT Ödeme Bildirimi: Login ekranından yeni firma başvurusu (Aylık / Yıllık Paket) ve IBAN kopyalama destekli EFT ödeme bildirimi.',
      'Sıfır Veri Kayıplı Yedekleme & Geri Yükleme: Eski tarihli veritabanı yedeği yüklense dahi yeni tabloları koruyan akıllı şema birleştirme.',
      'SQL Injection & XSS Güvenlik Katmanı: Tüm form ve API uç noktalarında otomatik veri temizleme (Sanitizer) ve doğrulama.',
      'Sesli Navigasyon & Ctrl+K Komut Paleti: "Mutabakatları aç", "Carilere git" gibi sesli komutlarla eller serbest kullanım.'
    ],
    workflowSteps: ['Firma & Entegrasyon Ayarları', 'Aylık / Yıllık Lisans Yönetimi', 'Otomatik Şema Korumalı Yedekleme', 'Süper Admin Multi-Tenant Kontrol'],
    visualData: {
      windowTitle: 'ayarlar / sistem-ve-super-admin',
      windowMeta: 'Multi-Tenant · Aylık & Yıllık Paket · Güvenlik',
      kpis: [
        { label: 'Lisans Standartları', value: 'Aylık & Yıllık', sub: 'Esnek Paket Yapısı' },
        { label: 'Güvenlik Zırhı', value: 'SQLi + XSS', sub: 'Aktif Sanitizer' },
        { label: 'Veritabanı Yedek', value: '%100 Uyumlu', sub: 'Otomatik Migrasyon' }
      ],
      rows: [
        { col1: 'Yeni Firma Lisans Başvurusu (Kayıt Ol)', col2: 'Aylık (1 Ay) / Yıllık (12 Ay)', col3: 'Genişletilmiş Görsel Form', highlight: 'emerald' },
        { col1: 'Banka Havale / EFT Ödeme Bildirimi', col2: 'IBAN Kopyala & Dekont Bildir', col3: 'Yöneticiye Otomatik Mail', highlight: 'sky' }
      ],
      footerNote: 'Eski yedekler yüklendiğinde hiçbir veri zarar görmez; eksik tablolar otomatik tamamlanır.'
    }
  }
];

export const TanitimWebsitesi: React.FC<TanitimWebsitesiProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'satis' | 'finans' | 'stok' | 'kurumsal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = ALL_MODULES.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    if (!matchesCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.features.some((f) => f.toLowerCase().includes(q))
    );
  });

  const handleDownloadStandaloneHtml = async () => {
    try {
      const res = await fetch('/tanitim.html');
      if (!res.ok) throw new Error('HTML dosyası alınamadı');
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Esila_Ticari_ERP_Tanitim_Websitesi.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Tek sayfalık tanıtım web sitesi (HTML) başarıyla indirildi!');
    } catch (_e) {
      toast.error('HTML dosyası indirilirken bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            className="text-xl font-extrabold tracking-tight text-emerald-800 whitespace-nowrap shrink-0"
          >
            Esila Ticari
          </a>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#tum-moduller"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              22 Modül Rehberi
            </a>
            <a
              href="#mutabakat-detay"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Online Mutabakat
            </a>
            <a
              href="#mimari-guvenlik"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Mimari ve Güvenlik
            </a>
            <a
              href="#lisans-paketleri"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Lisans Paketleri
            </a>
            <a
              href="/tanitim.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Saf HTML Görünümü
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Sisteme / Giriş'e Dön</span>
              </button>
            ) : (
              <a
                href="/"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sisteme Giriş Yap
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="bg-white border-b border-slate-200 py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="text-xs font-medium text-slate-500">
                  <span>Bulut Tabanlı Kurumsal ERP</span>
                  <span aria-hidden="true"> · </span>
                  <span>22 Entegre Modül</span>
                  <span aria-hidden="true"> · </span>
                  <span>Multi-Tenant Mimari</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Esila Ticari sistemindeki tüm özellikler, modül modül en ince ayrıntısına kadar.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  Hızlı Satış (POS), Cari Hesaplar, E-Fatura, Online Onaylı Mutabakat (Toplu PDF &amp; Hatırlatıcı), Reçeteli Üretim (BOM), Çoklu Depo, Fiziksel Stok Sayım, Kasa/Banka, Çek/Senet, Teknik Servis, CRM ve İK süreçlerini tek çatı altında birleştiren kapsamlı ürün kataloğu ve tanıtım web sitesi.
                </p>
              </div>

              <div className="pt-2 space-y-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadStandaloneHtml}
                    className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Tek Dosya HTML Web Sitesini İndir (.html)</span>
                  </button>
                  <a
                    href="/tanitim.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Eye size={16} />
                    <span>Saf HTML Sayfasını Aç</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Printer size={16} />
                    <span>Yazdır / PDF Kaydet</span>
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  <span>İndirilen HTML dosyası tamamen bağımsızdır; herhangi bir sunucu gerektirmeden çift tıklayarak her bilgisayarda açılır.</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive ERP Visual Window */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl overflow-hidden h-full flex flex-col justify-between">
                <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>esila-ticari.cloud / 22-modul-komuta-merkezi</span>
                  <span>Aktif Sürüm · 2026</span>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono tabular-nums">
                    <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3">
                      <div className="text-[11px] text-slate-400 font-sans">Kasa &amp; Banka</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">₺1.482.950</div>
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3">
                      <div className="text-[11px] text-slate-400 font-sans">Cari Alacaklar</div>
                      <div className="text-sm font-bold text-sky-400 mt-1">₺845.200</div>
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3">
                      <div className="text-[11px] text-slate-400 font-sans">Stok Değeri</div>
                      <div className="text-sm font-bold text-white mt-1">₺2.190.000</div>
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3">
                      <div className="text-[11px] text-slate-400 font-sans">Online Mutabakat</div>
                      <div className="text-sm font-bold text-amber-400 mt-1">%94 Onay</div>
                    </div>
                  </div>

                  {/* Mini Module Map inside Visual */}
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
                    <div className="text-xs font-semibold text-slate-200 mb-2.5">
                      Entegre Modül Akış Şeması (Gerçek Zamanlı Veri Paylaşımı)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-slate-900/90 border border-slate-700 rounded px-2.5 py-2 text-slate-200">
                        <strong className="text-emerald-400">01-02.</strong> Panel &amp; Hızlı Satış POS
                      </div>
                      <div className="bg-slate-900/90 border border-slate-700 rounded px-2.5 py-2 text-slate-200">
                        <strong className="text-emerald-400">03-04.</strong> Cariler &amp; Online Mutabakat
                      </div>
                      <div className="bg-slate-900/90 border border-slate-700 rounded px-2.5 py-2 text-slate-200">
                        <strong className="text-emerald-400">05-06.</strong> E-Fatura &amp; Ürün Barkod
                      </div>
                      <div className="bg-slate-900/90 border border-slate-700 rounded px-2.5 py-2 text-slate-200">
                        <strong className="text-emerald-400">07-09.</strong> Satış, Sipariş &amp; Satın Alma
                      </div>
                      <div className="bg-slate-900/90 border border-slate-700 rounded px-2.5 py-2 text-slate-200">
                        <strong className="text-emerald-400">10-12.</strong> Üretim BOM, Depo &amp; Sayım
                      </div>
                      <div className="bg-slate-900/90 border border-slate-700 rounded px-2.5 py-2 text-slate-200">
                        <strong className="text-emerald-400">13-22.</strong> Kasa, Çek, Teklif, Servis, İK
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>Komut Paleti: <strong className="text-slate-200 font-mono">Ctrl + K</strong></span>
                    <span>Sesli Komut: <strong className="text-slate-200">Türkçe Mikrofon Desteği</strong></span>
                    <span>Güvenlik: <strong className="text-emerald-400">SQLi &amp; XSS Korumalı</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Quantitative Proof Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-10 border-t border-slate-200">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">22 Modül</div>
              <div className="text-sm font-semibold text-slate-800 mt-1">Uçtan Uca Tüm Departmanlar</div>
              <p className="text-xs text-slate-500 mt-1">Ön muhasebe, perakende POS, üretim, depo, teknik servis ve İK tek çatı altında.</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">Online Onay</div>
              <div className="text-sm font-semibold text-slate-800 mt-1">Mutabakat &amp; Fiyat Teklifi</div>
              <p className="text-xs text-slate-500 mt-1">Müşteriye giden linkle tek tıkla onay/red, toplu A4 PDF indirme ve otomatik hatırlatıcı.</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">%65 Tasarruf</div>
              <div className="text-sm font-semibold text-slate-800 mt-1">Optimize Ağ Trafiği</div>
              <p className="text-xs text-slate-500 mt-1">Gzip sıkıştırma, ETag 304 kontrolü ve birleştirilmiş Bootstrap API mimarisi.</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">%100 Koruma</div>
              <div className="text-sm font-semibold text-slate-800 mt-1">Akıllı Yedek &amp; Sanitizer</div>
              <p className="text-xs text-slate-500 mt-1">Eski yedekleri veri kaybı olmadan yükleyen şema koruma ve SQLi/XSS güvenlik katmanı.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete 22 Modules Interactive Section */}
      <section id="tum-moduller" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <div className="text-xs font-medium text-emerald-700 mb-2">
                <span>Tüm Sistem Özellikleri</span>
                <span aria-hidden="true"> · </span>
                <span>22 Modülün Ayrıntılı Görsel İncelemesi</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Modül Modül Sistem Rehberi
              </h2>
            </div>

            {/* Interactive Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl print:hidden">
              {[
                { id: 'all', label: 'Tümü (22 Modül)' },
                { id: 'satis', label: 'Satış, POS & CRM (5)' },
                { id: 'finans', label: 'Finans, E-Fatura & Mutabakat (5)' },
                { id: 'stok', label: 'Stok, Depo & Üretim (5)' },
                { id: 'kurumsal', label: 'İK, Servis, Rapor & Yönetim (7)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-10 print:hidden">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Modül veya özellik ara (Örn: Mutabakat, Hatırlatıcı Gönder, Toplu PDF, Barkod, E-Fatura, Üretim Reçetesi, Çek...)"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Modules List */}
          <div className="space-y-10">
            {filteredModules.map((mod) => (
              <article
                key={mod.code}
                id={mod.code === 'mutabakat' ? 'mutabakat-detay' : `modul-${mod.code}`}
                className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Left: Detailed Explanation & Features */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                    <div className="space-y-3">
                      <div className="text-xs font-mono text-emerald-700">
                        <span>MODÜL {mod.index}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{mod.categoryLabel}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{mod.route}</span>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900">{mod.title}</h3>

                      <p className="text-sm text-slate-600 leading-relaxed">{mod.summary}</p>

                      <div className="pt-2 space-y-2">
                        <div className="text-xs font-bold text-slate-800">Alt Özellikler ve Fonksiyonlar:</div>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {mod.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Workflow Steps Line */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5">İş Akışı (Workflow):</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 font-medium">
                        {mod.workflowSteps.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span>{step}</span>
                            {sIdx < mod.workflowSteps.length - 1 && (
                              <span className="text-emerald-600 font-bold" aria-hidden="true">
                                →
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: High-Fidelity Visual UI Mockup for This Module */}
                  <div className="lg:col-span-6 flex flex-col">
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-full flex flex-col justify-between">
                      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-500">
                        <span>{mod.visualData.windowTitle}</span>
                        <span>{mod.visualData.windowMeta}</span>
                      </div>

                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                        {/* 3 Mini KPIs */}
                        <div className="grid grid-cols-3 gap-2.5">
                          {mod.visualData.kpis.map((kpi, kIdx) => (
                            <div key={kIdx} className="bg-white border border-slate-200 rounded-lg p-3">
                              <div className="text-[11px] text-slate-500 truncate">{kpi.label}</div>
                              <div className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                                {kpi.value}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Simulated Live Screen Table */}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                            <span>Canlı Ekran Görünümü ({mod.title.split('.')[1]?.trim() || mod.title})</span>
                            <span className="font-mono text-slate-400">Aktif Tablo</span>
                          </div>
                          <div className="divide-y divide-slate-100 text-xs">
                            {mod.visualData.rows.map((row, rIdx) => (
                              <div
                                key={rIdx}
                                className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                              >
                                <div className="font-medium text-slate-800">{row.col1}</div>
                                <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
                                  <span className="text-slate-500 font-sans">{row.col2}</span>
                                  <span
                                    className={`font-semibold ${
                                      row.highlight === 'emerald'
                                        ? 'text-emerald-700'
                                        : row.highlight === 'amber'
                                        ? 'text-amber-700'
                                        : row.highlight === 'rose'
                                        ? 'text-rose-700'
                                        : 'text-sky-700'
                                    }`}
                                  >
                                    {row.col3}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Technical Note */}
                        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600">
                          {mod.visualData.footerNote}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Technical Architecture Section */}
      <section id="mimari-guvenlik" className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-10">
            <div className="text-xs font-mono text-emerald-400 mb-2">ALTYAPI VE SİBER GÜVENLİK</div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Kurumsal Güvenlik, Düşük Ağ Trafiği ve Kesintisiz Yedekleme
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-2.5">
              <div className="text-xs font-mono text-emerald-400">01. SİBER GÜVENLİK</div>
              <h3 className="text-lg font-bold">SQL Injection ve XSS Sanitizer</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sistem genelindeki tüm veri giriş noktaları, form gönderimleri ve API uç noktaları hem istemci hem sunucu katmanında otomatik Input Validation ve Sanitizer koruması altındadır.
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-2.5">
              <div className="text-xs font-mono text-emerald-400">02. AĞ OPTİMİZASYONU</div>
              <h3 className="text-lg font-bold">Düşük Trafik ve Hızlı Tepki</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Gzip sıkıştırma, ETag (304 Not Modified) önbellekleme, birleştirilmiş <code>/api/bootstrap</code> başlangıç paketi ve akıllı sekme görünürlük kontrolüyle arka plan trafiği minimize edilmiştir.
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-2.5">
              <div className="text-xs font-mono text-emerald-400">03. VERİTABANI KORUMASI</div>
              <h3 className="text-lg font-bold">Kayıpsız Yedekleme ve Migrasyon</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Eski tarihli bir yedek yüklendiğinde mevcut kayıtlar korunur ve yeni eklenen tablolar (<code>payment_notifications</code>, <code>reconciliations</code>, <code>proposals</code> vb.) otomatik tamamlanır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Licensing Section */}
      <section id="lisans-paketleri" className="bg-white py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs font-medium text-emerald-700 mb-2">STANDART VE YILLIK LİSANS</div>
              <h2 className="text-3xl font-extrabold text-slate-900">Aylık Paket ve Yıllık Paket Seçenekleri</h2>
            </div>
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer self-start"
            >
              <Code2 size={15} />
              <span>Bu Tanıtım Sitesini HTML Olarak İndir</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-3">
              <div className="text-xs font-mono text-slate-500">AYLIK STANDART PAKET</div>
              <h3 className="text-xl font-bold text-slate-900">Aylık Paket (1 Ay)</h3>
              <p className="text-sm text-slate-600">
                22 modülün tamamına tam erişim, sınırsız kullanıcı tanımlama ve bulut yedekleme içeren aylık lisans paketi.
              </p>
            </div>
            <div className="border-2 border-emerald-600 rounded-2xl p-6 bg-white space-y-3">
              <div className="text-xs font-mono text-emerald-700">KURUMSAL YILLIK PAKET</div>
              <h3 className="text-xl font-bold text-slate-900">Yıllık Paket (12 Ay)</h3>
              <p className="text-sm text-slate-600">
                12 ay boyunca kesintisiz tüm modüller, öncelikli teknik destek ve sabit fiyat avantajı sağlayan yıllık kurumsal lisans paketi.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-slate-900">Esila Ticari</strong> · "Ticaretin Bulut Hali" · Tüm 22 Modül Tanıtım Kataloğu
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              HTML Dosyasını İndir
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-slate-700 font-semibold hover:underline cursor-pointer"
              >
                Giriş Ekranına Dön
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
