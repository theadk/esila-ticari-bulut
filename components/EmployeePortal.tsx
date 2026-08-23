import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { User, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const EmployeePortal: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const { personnel, salaryAdjustments, setSalaryAdjustments } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Link currentUser to a Personnel record
  const myRecord = personnel.find(
    p => p.email === currentUser.email || (p.firstName + ' ' + p.lastName) === currentUser.name
  );

  if (!myRecord) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <User size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Çalışan Kaydı Bulunamadı</h2>
        <p>Hesabınızla eşleşen bir personel kaydı bulunamadı. Lütfen yöneticinizle iletişime geçin.</p>
      </div>
    );
  }

  const myRequests = (salaryAdjustments || [])
    .filter(a => a.personnelId === myRecord.id && a.type === 'Avans')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    const newRequest = {
      id: String(Date.now()),
      personnelId: myRecord.id,
      date: new Date().toISOString().split('T')[0],
      type: 'Avans' as const,
      amount: Number(amount),
      description,
      status: 'Bekliyor' as const
    };

    setSalaryAdjustments([...(salaryAdjustments || []), newRequest]);
    toast.success('Avans talebiniz yönetici onayına sunuldu.');
    setIsModalOpen(false);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Çalışan Portalı</h1>
          <p className="text-gray-600">Hoş geldiniz, {myRecord.firstName} {myRecord.lastName}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <CreditCard size={20} />
          Avans Talep Et
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Avans Taleplerim</h2>
        </div>
        
        {myRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Henüz bir avans talebiniz bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Tutar</th>
                  <th className="px-6 py-3">Açıklama</th>
                  <th className="px-6 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{new Date(req.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 font-medium">{req.amount.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-6 py-4 text-gray-600">{req.description}</td>
                    <td className="px-6 py-4">
                      {req.status === 'Bekliyor' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Clock size={12} /> Bekliyor
                        </span>
                      )}
                      {(req.status === 'Onaylandı' || !req.status) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle size={12} /> Onaylandı
                        </span>
                      )}
                      {req.status === 'Reddedildi' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle size={12} /> Reddedildi
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Yeni Avans Talebi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                />

                {myRecord.advanceLimit > 0 && Number(amount) > myRecord.advanceLimit && (
                  <p className="text-sm text-red-600 mt-2">
                    Uyarı: Talep ettiğiniz tutar aylık avans limitinizi ({(myRecord.advanceLimit || 0).toLocaleString('tr-TR')} ₺) aşmaktadır. Yönetici onayına gönderilecektir ancak limit aşımı bildirilecektir.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama / Neden</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-24"
                  placeholder="Avans talebi için kısa bir açıklama..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
