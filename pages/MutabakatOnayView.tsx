import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Building2, Calendar, Wallet, Clock } from 'lucide-react';

export const MutabakatOnayView: React.FC<{ id: string; vkn: string }> = ({ id, vkn }) => {
  const [status, setStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [reconciliation, setReconciliation] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const qs = new URLSearchParams({ vkn: vkn || '' });
        const res = await fetch(`/api/reconciliations/${id}/public?${qs.toString()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setReconciliation(data);
          if (data.responseNotes) {
            setNotes(data.responseNotes);
          }
        }
      } catch (_err) {
        // ignore
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [id, vkn]);

  const notifyOtherTabs = (action: 'approve' | 'reject') => {
    try {
      localStorage.setItem(
        'esila_mutabakat_updated',
        JSON.stringify({ id, action, timestamp: Date.now() })
      );
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('esila_mutabakat_channel');
        bc.postMessage({ id, action, timestamp: Date.now() });
        bc.close();
      }
    } catch (_e) {
      // ignore storage errors
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    setStatus('loading');
    try {
      const res = await fetch(`/api/reconciliations/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          vkn: reconciliation?.vkn || vkn || ''
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'İşlem sırasında bir hata oluştu');
      }
      const result = await res.json();
      if (result.reconciliation) {
        setReconciliation((prev: any) => ({ ...prev, ...result.reconciliation }));
      }
      notifyOtherTabs(action);
      setStatus('success');
      setMessage(
        action === 'approve'
          ? 'Mutabakat başarıyla onaylandı. Kayıtlar güncellenmiştir.'
          : 'İtirazınız ve notunuz başarıyla kaydedilerek ilgili firmaya iletildi.'
      );
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'İşlem sırasında bir hata oluştu');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">İşlem Başarılı</h1>
          <p className="text-gray-500 mb-6">{message}</p>
          {reconciliation && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm border border-gray-100 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Cari:</span>
                <span className="font-semibold text-gray-800">{reconciliation.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bakiye:</span>
                <span className="font-semibold text-gray-800">
                  {Number(reconciliation.balance || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} ({reconciliation.balanceType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Güncel Durum:</span>
                <span className={`font-bold ${reconciliation.status === 'Onaylandı' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {reconciliation.status}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => window.close()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-6 rounded-lg transition-colors w-full"
          >
            Pencereyi Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full border border-gray-100 text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Building2 size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Online Cari Mutabakat Onayı</h1>
        <p className="text-gray-500 text-sm mb-6">
          {reconciliation?.companyName
            ? `${reconciliation.companyName} tarafından gönderilen bakiye mutabakat bildirimi`
            : 'Bu hesap ekstresi için mutabakat durumunuzu belirtebilirsiniz.'}
        </p>

        {loadingDetails ? (
          <div className="py-6 text-sm text-gray-400 animate-pulse">Mutabakat bilgileri yükleniyor...</div>
        ) : reconciliation ? (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <span className="text-xs font-medium text-gray-500 uppercase">Cari Unvanı</span>
              <span className="text-sm font-bold text-gray-800">{reconciliation.customerName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <span className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                <Calendar size={14} /> Mutabakat Tarihi
              </span>
              <span className="text-sm font-medium text-gray-700">
                {reconciliation.date ? new Date(reconciliation.date).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <span className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                <Wallet size={14} /> Mutabakat Bakiyesi
              </span>
              <span className="text-base font-bold text-emerald-700">
                {Number(reconciliation.balance || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}{' '}
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {reconciliation.balanceType}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                <Clock size={14} /> Mevcut Durum
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  reconciliation.status === 'Onaylandı'
                    ? 'bg-emerald-100 text-emerald-700'
                    : reconciliation.status === 'Reddedildi'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {reconciliation.status || 'Bekliyor'}
              </span>
            </div>
            {reconciliation.notes && (
              <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Firma Notu: </span>
                {reconciliation.notes}
              </div>
            )}
          </div>
        ) : null}

        <textarea
          placeholder="Eklemek istediğiniz açıklama veya itiraz notunuz varsa buraya yazabilirsiniz..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-6 outline-none focus:border-emerald-500 text-sm h-24"
        ></textarea>

        {status === 'error' && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{message}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            disabled={status === 'loading'}
            onClick={() => handleAction('approve')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle size={24} className="mb-2" />
            <span className="font-semibold">Kabul Et ve Onayla</span>
          </button>

          <button
            disabled={status === 'loading'}
            onClick={() => handleAction('reject')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle size={24} className="mb-2" />
            <span className="font-semibold">Reddet ve İtiraz İlet</span>
          </button>
        </div>

        {status === 'loading' && (
          <p className="text-gray-500 mt-4 text-sm animate-pulse">İşlem yapılıyor, lütfen bekleyin...</p>
        )}
      </div>
    </div>
  );
};
