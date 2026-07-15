import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Mail, Smartphone, FileText, CheckCircle, Package, ArrowRight, Printer, QrCode, XCircle } from 'lucide-react';
import { QRCodeSVG } from "qrcode.react";

interface PublicFormProps {
  id?: string;
  type?: string;
  tenantId?: string;
  token?: string;
}

export const PublicFormView: React.FC<PublicFormProps> = ({ id, type, tenantId, token }) => {
  const [step, setStep] = useState<'initial' | 'verification' | 'success' | 'loading_token'>('initial');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [data, setData] = useState<{ record: any, customer: any, settings: any, products: any[], type?: string } | null>(null);

  useEffect(() => {
    if (token) {
       setStep('loading_token');
       verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tkn: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public-form/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tkn })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Token doğrulanamadı');
      const safeRecord = { ...result.record };
      if (typeof safeRecord.materialsUsed === 'string') safeRecord.materialsUsed = JSON.parse(safeRecord.materialsUsed);
      if (typeof safeRecord.plumbingChecklist === 'string') safeRecord.plumbingChecklist = JSON.parse(safeRecord.plumbingChecklist);
      if (typeof safeRecord.items === 'string') safeRecord.items = JSON.parse(safeRecord.items);
      if (typeof safeRecord.device === 'string') safeRecord.device = JSON.parse(safeRecord.device);
      if (typeof safeRecord.materials === 'string') safeRecord.materials = JSON.parse(safeRecord.materials);

      setData({
        record: safeRecord,
        customer: result.customer,
        settings: result.settings,
        products: result.products || [],
        type: result.type
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message);
      setStep('initial');
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public-form/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, t: tenantId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Kod gönderilemedi');
      setSentTo(result.sentTo);
      setStep('verification');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length < 6) return setError('Lütfen 6 haneli kodu giriniz');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public-form/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, t: tenantId, code })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Geçersiz kod');
      const safeRecord = { ...result.record };
      if (typeof safeRecord.materialsUsed === 'string') safeRecord.materialsUsed = JSON.parse(safeRecord.materialsUsed);
      if (typeof safeRecord.plumbingChecklist === 'string') safeRecord.plumbingChecklist = JSON.parse(safeRecord.plumbingChecklist);
      if (typeof safeRecord.items === 'string') safeRecord.items = JSON.parse(safeRecord.items);
      if (typeof safeRecord.device === 'string') safeRecord.device = JSON.parse(safeRecord.device);
      if (typeof safeRecord.materials === 'string') safeRecord.materials = JSON.parse(safeRecord.materials);

      setData({
        record: safeRecord,
        customer: result.customer,
        settings: result.settings,
        products: result.products || []
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'initial') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Güvenlik Doğrulaması</h1>
          <p className="text-gray-500 mb-8">
            Bu evrağa erişmek için müşteri kayıtlarındaki iletişim adresinize bir doğrulama kodu gönderilecek.
          </p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{error}</div>}

          <button
            onClick={requestVerification}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verification') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Kodu Giriniz</h1>
          <p className="text-gray-500 mb-8 text-sm">
            <strong className="text-gray-700 block mb-1">{sentTo}</strong>
            adresine gönderilen 6 haneli doğrulama kodunu giriniz.
          </p>

          <div className="mb-6">
            <input
              type="text"
              maxLength={6}
              value={code || ""}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{error}</div>}

          <button
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Doğrulanıyor...' : 'Evrağı Görüntüle'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading_token') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Bağlantı kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (step === 'success' && data) {
    const isTicket = (data.type || type) === 'ticket';
    
    // We render a simple clean version of the ticket or order
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-10 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isTicket ? 'Servis / Arıza Formu' : 'Sipariş Detayı'}
              </h1>
              <p className="text-gray-500 flex items-center gap-2">
                <FileText size={16} /> Form No: {isTicket ? (data.record.ticketNumber || data.record.id) : (data.record.orderNumber || data.record.id)}
              </p>
            </div>
            {data.settings?.companyLogo ? (
              <img src={data.settings.companyLogo} alt="Logo" className="h-16 object-contain" />
            ) : (
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-800">{data.settings?.companyName || 'Müşteri'}</h2>
                <p className="text-gray-500 mt-1">{data.settings?.phone}</p>
              </div>
            )}
          </div>

          <div className="p-6 md:p-10">
             {/* Info Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div>
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Müşteri Bilgileri</h3>
                   <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <p className="font-bold text-gray-800 text-lg mb-1">{data.customer?.name}</p>
                      <p className="text-gray-600">{data.customer?.phone}</p>
                      <p className="text-gray-600">{data.customer?.email}</p>
                      <p className="text-gray-500 text-sm mt-2">{data.customer?.address}</p>
                   </div>
                </div>
                <div>
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Evrak Detayı</h3>
                   <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3">
                      <div className="flex justify-between">
                         <span className="text-gray-500">Tarih</span>
                         <span className="font-medium text-gray-800">{new Date(data.record.date || data.record.createdAt || data.record.dateCreated).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-500">Durum</span>
                         <span className="font-medium text-gray-800">{data.record.status}</span>
                      </div>
                      {(data.record.totalAmount !== undefined || data.record.totalCost !== undefined) && (
                        <div className="flex justify-between pt-3 border-t border-gray-200">
                           <span className="text-gray-500">Toplam Tutar</span>
                           <span className="font-bold text-emerald-600">{Number(data.record.totalAmount || data.record.totalCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Content Area */}
             <div className="mt-8">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {isTicket ? 'Cihaz & İşlem Detayları' : 'Ürün / Hizmet Kalemleri'}
               </h3>
               
               {isTicket ? (
                 <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    <div className="p-5 flex flex-col md:flex-row gap-4 justify-between bg-white">
                       <div>
                         <p className="text-sm text-gray-500 mb-1">Cihaz</p>
                         <p className="font-medium text-gray-800">{data.record.device?.brand || data.record.deviceType} {data.record.device?.model || ''}</p>
                         {(data.record.device?.serialNumber || data.record.serialNumber) && <p className="text-xs text-gray-400 mt-1">S/N: {data.record.device?.serialNumber || data.record.serialNumber}</p>}
                       </div>
                       <div>
                         <p className="text-sm text-gray-500 mb-1">Şikayet</p>
                         <p className="font-medium text-gray-800">{data.record.issue || data.record.issueDescription}</p>
                       </div>
                    </div>
                    {(data.record.description || data.record.resolutionNotes) && (
                       <div className="p-5 bg-gray-50">
                         <p className="text-sm text-gray-500 mb-2">Açıklama / Teknisyen Notu</p>
                         <p className="text-gray-800 whitespace-pre-line">{data.record.description || data.record.resolutionNotes}</p>
                       </div>
                    )}
                    {data.record.plumbingChecklist && data.record.plumbingChecklist.length > 0 && (
                       <div className="p-5 bg-white border-b border-gray-100">
                         <p className="text-sm text-gray-500 mb-3">Kontrol Listesi / Testler</p>
                         <ul className="space-y-2">
                           {data.record.plumbingChecklist.map((m: any, i: number) => {
                             return (
                               <li key={i} className="flex gap-2 items-center text-sm">
                                  {m.isChecked ? (
                                     <CheckCircle size={16} className="text-emerald-500" />
                                  ) : (
                                     <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                  )}
                                  <span className="text-gray-700">{m.itemName}</span>
                               </li>
                             );
                           })}
                         </ul>
                       </div>
                    )}

                    {((data.record.materials && data.record.materials.length > 0) || (data.record.materialsUsed && data.record.materialsUsed.length > 0)) && (
                       <div className="p-5 bg-white border-b border-gray-100">
                         <p className="text-sm text-gray-500 mb-3">Kullanılan Malzeme & Ürünler</p>
                         <ul className="space-y-2">
                           {(data.record.materials || data.record.materialsUsed).map((m: any, i: number) => {
                             const pName = m.name || data.products.find((x:any)=>x.id===m.productId)?.name || 'Bilinmeyen Ürün';
                             return (
                               <li key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                                  <span className="text-gray-700">{pName}</span>
                                  <span className="text-gray-500">{m.quantity} {m.unit || 'Adet'} x {Number(m.price || m.unitPrice).toLocaleString('tr-TR')} TL</span>
                               </li>
                             );
                           })}
                         </ul>
                       </div>
                    )}
                    
                    {data.record.laborFee !== undefined && data.record.laborFee > 0 && (
                        <div className="p-5 bg-gray-50 flex justify-between items-center text-sm">
                          <span className="text-gray-700 font-medium">İşçilik / Servis Ücreti</span>
                          <span className="text-gray-700 font-medium">{Number(data.record.laborFee).toLocaleString('tr-TR')} TL</span>
                        </div>
                    )}
                 </div>
               ) : (
                 <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                       <thead className="bg-gray-50 text-gray-500">
                          <tr>
                             <th className="py-3 px-4 font-medium">Satır Açıklaması</th>
                             <th className="py-3 px-4 font-medium text-right w-24">Miktar</th>
                             <th className="py-3 px-4 font-medium text-right w-32">Birim Fiyat</th>
                             <th className="py-3 px-4 font-medium text-right w-32">Toplam</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {data.record.items?.map((item: any, i: number) => {
                             const pName = data.products.find((x:any)=>x.id===item.productId)?.name || 'Bilinmeyen Ürün';
                             return (
                               <tr key={i}>
                                  <td className="py-3 px-4">
                                     <p className="font-medium text-gray-800">{pName}</p>
                                     {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                                  </td>
                                  <td className="py-3 px-4 text-right">{item.quantity}</td>
                                  <td className="py-3 px-4 text-right">{Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                                  <td className="py-3 px-4 text-right font-medium text-gray-900">{(item.quantity * item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                               </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
               )}
             </div>

             <div className="mt-12 text-center text-gray-500 text-sm">
                <p>{data.settings?.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.'}</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                   <CheckCircle size={16} />
                   <span>Dijital olarak doğrulanmış evrak görünümüdür.</span>
                </div>
             </div>
          </div>
        </div>
        
        {/* Actions Float */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
           <button onClick={() => setIsQRModalOpen(true)} className="bg-emerald-600 text-white p-4 rounded-full shadow-xl hover:bg-emerald-700 transition-colors flex items-center justify-center" title="QR ile Paylaş">
              <QrCode size={24} />
           </button>
           <button onClick={() => window.print()} className="bg-gray-900 text-white p-4 rounded-full shadow-xl hover:bg-gray-800 transition-colors flex items-center justify-center" title="Yazdır">
              <Printer size={24} />
           </button>
        </div>

      {isQRModalOpen && (
        <div
          className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-[60] animate-fade-in"
          onClick={() => setIsQRModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <QrCode className="text-emerald-600" />
                Dökuman QR Kodu
              </h3>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-white">
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
                <QRCodeSVG
                  value={window.location.href || ""}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Müşteriler bu QR kodu okutarak formu dijital olarak görüntüleyebilirler.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

  return null;
};
