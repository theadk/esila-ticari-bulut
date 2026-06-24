import React, { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { Proposal, ProposalStatus } from '../types';
import { CheckCircle, XCircle, CreditCard, Landmark, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  id: string;
  tenantId: string;
}

export const PublicProposalView: React.FC<Props> = ({ id, tenantId }) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pos' | 'havale' | null>(null);

  // Fallback to local store if not an API driven component
  const store = useAppStore();

  useEffect(() => {
    // Try to load from store first
    const localProposal = store.proposals.find(p => p.id === id);
    if (localProposal) {
      setProposal(localProposal);
      setLoading(false);
    } else {
      // In a real app we would fetch from public API
      setLoading(false);
      setError('Teklif bulunamadı.');
    }
  }, [id, store.proposals]);

  const handleApprove = () => {
    if (!proposal) return;
    const updated = { ...proposal, status: ProposalStatus.ACCEPTED };
    setProposal(updated);
    
    // update in store
    const newProposals = store.proposals.map(p => p.id === updated.id ? updated : p);
    store.setProposals(newProposals);
    
    toast.success('Teklif başarıyla onaylandı!');
  };

  const handleReject = () => {
    if (!proposal) return;
    const updated = { ...proposal, status: ProposalStatus.REJECTED };
    setProposal(updated);

    // update in store
    const newProposals = store.proposals.map(p => p.id === updated.id ? updated : p);
    store.setProposals(newProposals);
    
    toast.success('Teklif reddedildi.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Yükleniyor...</div>;
  }

  if (error || !proposal) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">{error || 'Hata'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Proposal Details */}
        <div className="flex-1 p-6 md:p-10 border-r border-gray-100 bg-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Teklif Detayı</h1>
              <p className="text-gray-500">#{proposal.id} - {proposal.customerName}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between pb-4 border-b border-gray-100">
              <span className="text-gray-500">Tarih</span>
              <span className="font-medium text-gray-800">{new Date(proposal.date).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-gray-100">
              <span className="text-gray-500">Geçerlilik</span>
              <span className="font-medium text-gray-800">{new Date(proposal.validUntil).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-gray-100">
              <span className="text-gray-500">Durum</span>
              <span className={`font-medium ${proposal.status === ProposalStatus.ACCEPTED ? 'text-emerald-600' : proposal.status === ProposalStatus.REJECTED ? 'text-red-600' : 'text-yellow-600'}`}>
                {proposal.status}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-gray-800 mb-4">Hizmet / Ürün Kalemleri</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mb-6">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 rounded-l-lg">Açıklama</th>
                  <th className="p-3 text-center">Miktar</th>
                  <th className="p-3 text-right rounded-r-lg">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {proposal.items.map((item, index) => {
                  const netPrice = item.price * (1 - item.discountRate / 100);
                  return (
                    <tr key={index} className="border-b border-gray-50">
                      <td className="p-3 text-gray-800 font-medium">
                        {item.productName}
                        {item.discountRate > 0 && <span className="text-xs text-gray-400 block">(-%{item.discountRate} İndirim)</span>}
                      </td>
                      <td className="p-3 text-center text-gray-600">{item.quantity} {item.unit || 'Adet'}</td>
                      <td className="p-3 text-right font-medium text-gray-800">
                        {Number((netPrice * item.quantity) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
             <div className="flex justify-between text-sm text-gray-600">
                <span>Ara Toplam:</span>
                <span>{Number((proposal.subTotal - proposal.discountTotal) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
             </div>
             <div className="flex justify-between text-sm text-gray-600">
                <span>KDV:</span>
                <span>{Number(proposal.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
             </div>
             <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200 mt-2">
                <span>Genel Toplam:</span>
                <span className="text-emerald-600">{(proposal.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
             </div>
          </div>
        </div>

        {/* Right Side: Actions & Payment */}
        <div className="w-full md:w-96 bg-gray-50 p-6 md:p-10 flex flex-col justify-center">
          
          {proposal.status === ProposalStatus.PENDING ? (
            <div className="space-y-4">
               <h3 className="text-xl font-bold text-gray-800 mb-2">Kararınız</h3>
               <p className="text-sm text-gray-500 mb-6">Teklifi inceledikten sonra onaylayabilir veya reddedebilirsiniz.</p>
               
               <button onClick={handleApprove} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]">
                 <CheckCircle size={20} />
                 Teklifi Onayla
               </button>
               
               <button onClick={handleReject} className="w-full py-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                 <XCircle size={20} />
                 Teklifi Reddet
               </button>
            </div>
          ) : proposal.status === ProposalStatus.ACCEPTED ? (
            <div className="space-y-6">
               <div className="bg-emerald-100 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
                 <CheckCircle size={24} className="text-emerald-600 shrink-0" />
                 <div>
                    <p className="font-bold">Teklif Onaylandı</p>
                    <p className="text-sm opacity-90">Bizi tercih ettiğiniz için teşekkür ederiz.</p>
                 </div>
               </div>

               <div className="pt-4">
                  <h3 className="font-bold text-gray-800 mb-4">Ödeme Yöntemi Seçin</h3>
                  
                  <div className="space-y-3">
                     <button 
                       onClick={() => setPaymentMethod('pos')}
                       className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'pos' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                     >
                       <div className={`p-2 rounded-lg ${paymentMethod === 'pos' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                         <CreditCard size={24} />
                       </div>
                       <div className="text-left flex-1">
                          <p className="font-bold text-gray-800">Kredi Kartı / Sanal POS</p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">Yakında Aktif Olacak</p>
                       </div>
                     </button>
                     
                     <button 
                       onClick={() => setPaymentMethod('havale')}
                       className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'havale' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                     >
                       <div className={`p-2 rounded-lg ${paymentMethod === 'havale' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                         <Landmark size={24} />
                       </div>
                       <div className="text-left">
                          <p className="font-bold text-gray-800">Havale / EFT</p>
                          <p className="text-xs text-gray-500 mt-1">Banka hesaplarına transfer</p>
                       </div>
                     </button>
                  </div>

                  {paymentMethod === 'havale' && (
                    <div className="mt-6 bg-white p-4 rounded-xl border border-gray-200 text-sm animate-fade-in">
                       <p className="font-bold text-gray-800 mb-2">Banka Hesap Bilgilerimiz</p>
                       <div className="space-y-2 text-gray-600">
                          <p><strong>Banka:</strong> Ziraat Bankası</p>
                          <p><strong>Alıcı:</strong> Esila Ticari Yazılım Ltd.</p>
                          <p><strong>IBAN:</strong> TR00 0000 0000 0000 0000 0000 00</p>
                          <p className="mt-2 text-xs text-gray-500 italic">Lütfen açıklama kısmına <strong>{proposal.id}</strong> numaralı teklif kodunu yazmayı unutmayın.</p>
                       </div>
                    </div>
                  )}

                  {paymentMethod === 'pos' && (
                    <div className="mt-6 bg-white p-4 rounded-xl border border-gray-200 text-sm text-center animate-fade-in">
                       <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
                       <p className="text-gray-500">Sanal POS entegrasyonu çok yakında aktif edilecektir. Anlayışınız için teşekkür ederiz.</p>
                    </div>
                  )}
               </div>
            </div>
          ) : (
             <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center gap-3">
               <XCircle size={24} className="text-red-500 shrink-0" />
               <div>
                  <p className="font-bold">Teklif Reddedildi</p>
                  <p className="text-sm opacity-90">İlginiz için teşekkür ederiz.</p>
               </div>
             </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
