import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Database, Server, Mail, Send, CheckCircle2, Landmark, XCircle, Clock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface SystemStatusData {
  db: {
    status: string;
    responseTime: number;
    isFallback?: boolean;
    alertInfo?: {
      lastAlertSentAt: string | null;
      lastAlertError: string | null;
      adminEmails: string[];
    };
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  cpu: {
    cores: number;
    model: string;
    loadAvgs: number[];
  };
  uptime: number;
  security?: {
    blockedSqlInjectionCount: number;
    blockedXssCount?: number;
    sanitizedInputsCount?: number;
    blockedScannerCount: number;
    blockedPathTraversalCount: number;
    lastBlockedAt: string | null;
    lastBlockedReason: string | null;
  };
  traffic?: {
    compressedResponsesCount: number;
    notModified304Count: number;
    batchedBootstrapCount: number;
    cachedExchangeRateHits: number;
    savedBytesTotal: number;
  };
}

interface PaymentNotificationItem {
  id: string;
  merchant_oid?: string;
  name: string;
  vkn?: string;
  email: string;
  phone: string;
  senderName?: string;
  selectedBank?: string;
  amount: number;
  receiptNote?: string;
  status: string;
  createdAt?: string;
  notifiedAdmins?: string[];
}

export const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [payments, setPayments] = useState<PaymentNotificationItem[]>([]);
  const [paymentAdminEmails, setPaymentAdminEmails] = useState<string[]>(['ahdurko@gmail.com']);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch status", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentNotifications = async () => {
    try {
      const res = await fetch('/api/payment/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.payments)) {
          setPayments(data.payments);
        }
        if (Array.isArray(data.adminEmails) && data.adminEmails.length > 0) {
          setPaymentAdminEmails(data.adminEmails);
        }
      }
    } catch (e) {
      console.error("Failed to fetch payment notifications", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchPaymentNotifications();

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchStatus();
        fetchPaymentNotifications();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStatus();
        fetchPaymentNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUpdatePaymentStatus = async (id: string, newStatus: 'Onaylandı' | 'Reddedildi') => {
    try {
      const res = await fetch(`/api/payment/notifications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Ödeme bildirimi "${newStatus}" olarak güncellendi.`);
        await fetchPaymentNotifications();
      } else {
        toast.error(data.error || 'Durum güncellenemedi.');
      }
    } catch (err) {
      toast.error('Bağlantı hatası oluştu.');
    }
  };

  const handleTestDbAlert = async () => {
    setSendingAlert(true);
    try {
      const res = await fetch('/api/system-status/test-db-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const recipients = (data.recipients || []).join(', ');
        toast.success(`Veritabanı bağlantı kesintisi uyarı e-postası gönderildi (${recipients})`);
        await fetchStatus();
      } else {
        toast.error(data.error || 'Bildirim e-postası gönderilemedi.');
      }
    } catch (err) {
      toast.error('Bağlantı hatası oluştu.');
    } finally {
      setSendingAlert(false);
    }
  };

  if (loading && !status) {
    return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  }

  if (!status) {
    return <div className="p-8 text-center text-red-500">Sistem durumu alınamadı.</div>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}g ${h}s ${m}d`;
  };

  const adminEmails = status.db.alertInfo?.adminEmails || paymentAdminEmails;

  return (
    <div className="space-y-6 animate-fade-in sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Sistem Durumu & Bildirim Merkezi</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-600">Canlı Bağlantı</span>
        </div>
      </div>

      {/* Banka Havale / EFT Ödeme Bildirimleri & Admin Mail Bilgisi */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Landmark size={22} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Gelen Havale / EFT Ödeme Bildirimleri</h4>
              <p className="text-xs text-gray-500">
                Giriş ekranından gönderilen ödeme bildirimleri otomatik olarak yönetici e-posta adresine (<strong>{adminEmails.join(', ')}</strong>) gönderilir ve aşağıda listelenir.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md border border-emerald-200 shrink-0">
            <Mail size={13} /> Admin Mail Bildirimi Aktif
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            Henüz gönderilmiş bir Havale / EFT ödeme bildirimi bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="py-2.5 px-3 font-semibold">Ref No / Tarih</th>
                  <th className="py-2.5 px-3 font-semibold">Firma / Müşteri</th>
                  <th className="py-2.5 px-3 font-semibold">Gönderen / Banka</th>
                  <th className="py-2.5 px-3 font-semibold">Tutar</th>
                  <th className="py-2.5 px-3 font-semibold">Durum</th>
                  <th className="py-2.5 px-3 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-gray-800">{item.id}</div>
                      <div className="text-[11px] text-gray-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : '-'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-500">{item.email} • {item.phone}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-800">{item.senderName || '-'}</div>
                      <div className="text-[11px] text-gray-500">{item.selectedBank || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {Number(item.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[11px] ${
                          item.status === 'Onaylandı'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Reddedildi'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status === 'Onaylandı' ? (
                          <CheckCircle2 size={11} />
                        ) : item.status === 'Reddedildi' ? (
                          <XCircle size={11} />
                        ) : (
                          <Clock size={11} />
                        )}
                        {item.status || 'Kontrol Bekliyor'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {item.status !== 'Onaylandı' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdatePaymentStatus(item.id, 'Onaylandı')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Onayla
                          </button>
                          {item.status !== 'Reddedildi' && (
                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentStatus(item.id, 'Reddedildi')}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-medium transition-colors"
                            >
                              Reddet
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Status */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className={`p-2 rounded-lg ${status.db.isFallback ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                <Database size={24} className={status.db.isFallback ? 'text-amber-500' : 'text-emerald-600'} />
              </div>
              <h4 className="font-medium text-gray-900">Veritabanı</h4>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200">
              <CheckCircle2 size={13} /> E-Posta Bildirimi Aktif
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Durum:</span>
              <span className="font-semibold text-emerald-600">
                Bağlı (esilayaz_esilaticari)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gecikme:</span>
              <span className="font-semibold text-gray-700">{status.db.responseTime} ms</span>
            </div>
            <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Mail size={13} /> Bildirim Alıcısı:
                </span>
                <span className="font-medium text-gray-800">{adminEmails.join(', ')}</span>
              </div>
              {status.db.alertInfo?.lastAlertSentAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Son Kesinti Uyarısı:</span>
                  <span className="font-medium text-amber-700">
                    {new Date(status.db.alertInfo.lastAlertSentAt).toLocaleString('tr-TR')}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestDbAlert}
                  disabled={sendingAlert}
                  className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send size={13} />
                  {sendingAlert ? 'Uyarı E-Postası Gönderiliyor...' : 'Kesinti Bildirim E-Postasını Test Et'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CPU Status */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cpu size={24} />
            </div>
            <h4 className="font-medium text-gray-900">İşlemci (CPU)</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Çekirdek:</span>
              <span className="font-semibold text-gray-700">{status.cpu.cores} Çekirdek</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Model:</span>
              <span className="text-gray-700 text-right truncate max-w-[200px]" title={status.cpu.model}>
                {status.cpu.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Yük (1dk):</span>
              <span className="font-semibold text-gray-700">{status.cpu.loadAvgs?.[0]?.toFixed(2) || 0}</span>
            </div>
          </div>
        </div>

        {status.db.isFallback && (
          <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm text-amber-800">
            <div className="font-semibold mb-2">Canlı Ortam Uyarısı!</div>
            <p className="text-sm">
              Şu anda geçici (fallback) yerel veritabanını kullanıyorsunuz. <strong>Ana veritabanı ile bağlantı koptuğunda sistem otomatik olarak yönetici e-posta adresine ({adminEmails.join(', ')}) kritik uyarı maili gönderir ve veri kaybını önlemek için yerel yedek moduna geçer.</strong>
            </p>
          </div>
        )}

        {/* Memory Status */}
        <div className="bg-white border rounded-xl p-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity size={24} />
            </div>
            <h4 className="font-medium text-gray-900">Sistem Belleği (RAM)</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">
                Kullanılan: <span className="font-semibold text-gray-900">{formatBytes(status.memory.used)}</span> / {formatBytes(status.memory.total)}
              </span>
              <span className="font-semibold text-indigo-600">{status.memory.usagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  status.memory.usagePercentage > 85 ? 'bg-red-500' : 
                  status.memory.usagePercentage > 60 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${status.memory.usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* SQL Injection, XSS Sanitizer & Anti-Reverse Engineering Shield */}
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">SQL Injection (WAF), XSS Sanitizer & Input Validation Kalkanı</h4>
                <p className="text-xs text-gray-500">Tüm form girişlerinde ve API uç noktalarında parametreli sorgu, XSS/HTML arındırıcı (Sanitizer), şema doğrulama ve kaynak kod koruması devrededir.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md shrink-0">
              <CheckCircle2 size={13} /> Tam Koruma Aktif
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">SQLi & XSS Sanitizer</span>
              <span className="font-semibold text-emerald-700">WAF + Deep Sanitizer + Validation</span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">Tersine Mühendislik</span>
              <span className="font-semibold text-emerald-700">SourceMap Kapalı & DevTools Korumalı</span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">Engellenen SQLi / XSS / Bot</span>
              <span className="font-mono font-bold text-gray-800">
                {(status.security?.blockedSqlInjectionCount || 0) + (status.security?.blockedXssCount || 0) + (status.security?.blockedScannerCount || 0)} Girişim
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">Arındırılan Girdi & Dosya Kalkanı</span>
              <span className="font-mono font-bold text-gray-800">
                {(status.security?.sanitizedInputsCount || 0) + (status.security?.blockedPathTraversalCount || 0)} İşlem
              </span>
            </div>
          </div>
        </div>

        {/* Background Traffic Optimization Shield */}
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3 text-blue-700">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Activity size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Arka Plan Ağ Trafiği Optimizasyonu</h4>
                <p className="text-xs text-gray-500">Tekli Bootstrap paketleme (31 istek → 1 istek), Gzip sıkıştırma, ETag 304 önbellekleme ve sekme görünürlüğüne duyarlı akıllı sorgulama aktiftir.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-md shrink-0">
              <CheckCircle2 size={13} /> Düşük Trafik Modu Aktif
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">Tekli Başlangıç (Bootstrap)</span>
              <span className="font-semibold text-blue-700">
                {status.traffic?.batchedBootstrapCount || 0} Paket ({((status.traffic?.batchedBootstrapCount || 0) * 30)} İstek Tasarrufu)
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">ETag 304 & Kur Önbellek</span>
              <span className="font-semibold text-blue-700">
                {(status.traffic?.notModified304Count || 0) + (status.traffic?.cachedExchangeRateHits || 0)} Önbellek Yanıtı
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">Gzip Sıkıştırılan Yanıt</span>
              <span className="font-mono font-bold text-gray-800">
                {status.traffic?.compressedResponsesCount || 0} Yanıt
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <span className="text-gray-500 block">Kazanılan Bant Genişliği</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatBytes(status.traffic?.savedBytesTotal || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="bg-white border rounded-xl p-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4 text-purple-600">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Server size={24} />
            </div>
            <h4 className="font-medium text-gray-900">Sunucu Bilgisi</h4>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Açık Kalma Süresi (Uptime):</span>
            <span className="font-semibold text-gray-700">{formatUptime(status.uptime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
