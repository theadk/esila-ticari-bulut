# Esila Ticari Sistem Kurulumu

Eğer sistemi aktif ticari bir şekilde canlı ortamda kullanacaksanız **mutlaka** harici bir MySQL veritabanına ihtiyacınız vardır (Örn. uzak bir hosting firmasındaki MySQL sunucunuz veya Google Cloud SQL).

Sistem şu şekilde kurgulanmıştır:

1. **Geliştirici veya Demo Ortamı (Fallback DB):** 
   Eğer ortada bir veritabanı yoksa veya bağlantı başarısızsa sistem `local_db.json` üzerinde işlemlerini yürütür. Ancak canlı bir Cloud ortamında bu in-memory veya geçici sayıldığı için veriler kaybolabilir.

2. **Canlı Kullanım (MySQL DB):**
   Sistemin `server.ts` dosyası `.env` içinde belirtilen `DATABASE_URL` MySQL sunucusuna bağlanıp verileri kaydeder.
   
---

## Veritabanı Nasıl Aktif Edilir?

Aşağıdaki adımları uygulayınız:

1. Kök dizinde (root) `.env` adında bir dosya oluşturun veya mevcutsa açın.
2. Aşağıdaki yapıda bağlantı metnini ekleyin:

```env
DATABASE_URL="mysql://veritabani_kullanicisi:Sifre@uzak_sunucu_ip_veya_host:3306/veritabani_adi"
```

3. Gerekli MySQL tabloları otomatik bulunmuyorsa sistem başlatılırken `esila_ticari_schema.sql` dosyasındaki yapılar kullanılarak tablolar oluşturulur.
4. "Yedekten Dön" (restore-nightly-backup) yaptığınızda verileriniz güvenle uzak veritabanına eklenecektir.

## Yedeklerin Yüklenmesi Başarısız Olursa

Eğer `restore-tenant-backup` (Müşteri bazlı yükleme) veya `restore-nightly-backup` başarısız olursa;  
Loglarda `"connect ECONNREFUSED 127.0.0.1:3306"` görüyorsanız bu veritabanınızın Localhost olarak girilmesi fakat cloud ortamında bulunamamasından kaynaklanır.

Lütfen uzak veritabanı bilgilerinizi doğru yazdığınızdan emin olun.
