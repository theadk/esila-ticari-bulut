import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export const MutabakatOnayView: React.FC<{ id: string; vkn: string }> = ({ id, vkn }) => {
  const [status, setStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');

  const handleAction = async (action: 'approve' | 'reject') => {
    setStatus('loading');
    try {
      const qs = new URLSearchParams({ notes, vkn });
      const res = await fetch(`/api/reconciliations/${id}/${action}?${qs.toString()}`);
      if (!res.ok) {
        throw new Error('İşlem sırasında bir hata oluştu');
      }
      setStatus('success');
      setMessage(action === 'approve' ? 'Mutabakat başarıyla onaylandı.' : 'İtirazınız başarıyla iletildi.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
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
          <button onClick={() => window.close()} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors">
            Pencereyi Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100 text-center w-[500px]">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mutabakat Onayı</h1>
        <p className="text-gray-600 mb-6">Bu hesap ekstresi için mutabakat durumunuzu belirtebilirsiniz.</p>
        
        <textarea 
          placeholder="Eklemek istediğiniz notunuz varsa buraya yazabilirsiniz..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-6 outline-none focus:border-blue-500 text-sm h-24"
        ></textarea>

        {status === 'error' && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            disabled={status === 'loading'}
            onClick={() => handleAction('approve')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
          >
            <CheckCircle size={24} className="mb-2" />
            <span className="font-medium">Kabul Et ve Onayla</span>
          </button>
          
          <button
            disabled={status === 'loading'}
            onClick={() => handleAction('reject')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
          >
            <XCircle size={24} className="mb-2" />
            <span className="font-medium">Reddet ve İtiraz İlet</span>
          </button>
        </div>
        
        {status === 'loading' && <p className="text-gray-500 mt-4 text-sm animate-pulse">İşlem yapılıyor, lütfen bekleyin...</p>}
      </div>
    </div>
  );
};
