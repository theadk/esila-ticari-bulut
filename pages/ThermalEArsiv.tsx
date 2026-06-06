import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const ThermalEArsiv = ({ previewInvoice, invoiceOrder, store, invoiceCustomer }: any) => {
  const qrDate = previewInvoice?.date ? new Date(previewInvoice.date).toISOString().split('T')[0] : "2026-01-03";
  const qrDataObj = {
    vkntckn: store.settings?.companyVkn || "3790894905",
    avkntckn: invoiceCustomer?.taxNumber || invoiceCustomer?.tcNo || "0100359315",
    senaryo: previewInvoice?.scenario || "EARSIVFATURA",
    tip: previewInvoice?.type || "SATIS",
    tarih: qrDate,
    no: previewInvoice?.id || "ESI2026000002001",
    ettn: previewInvoice?.id ? `${previewInvoice?.id.toLowerCase()}-e-fatura-ettn` : "e9baec5d-f923-4f06-894b-e3de911a16c2",
    parabirimi: "TRY",
    "malhizmettoplam": (invoiceOrder?.subTotal || (previewInvoice?.amount / 1.2)).toFixed(2),
    "kdvmatrah(20)": (invoiceOrder?.subTotal || (previewInvoice?.amount / 1.2)).toFixed(2),
    "hesaplanankdv(20)": (invoiceOrder?.taxTotal || (previewInvoice?.amount - previewInvoice?.amount / 1.2)).toFixed(2),
    vergidahil: (invoiceOrder?.total || previewInvoice?.amount).toFixed(2),
    odenecek: (invoiceOrder?.total || previewInvoice?.amount).toFixed(2)
  };

  return (
    <div className="bg-white p-4 mx-auto w-[300px] text-[11px] font-sans text-black shadow-sm print:shadow-none print:m-0 print-target" id="invoice-preview-80mm" style={{ fontSize: '11px' }}>
      <div className="flex flex-col items-center mb-4 text-center">
        <img 
          src="/gib-logo.png" 
          alt="GİB Logo" 
          className="w-16 object-contain mix-blend-multiply flex-shrink-0 mb-1" 
        />
        {store.settings?.invoiceTemplate_showQR !== false && (
          <div className="flex justify-center mb-2 mt-2">
            <QRCodeSVG value={JSON.stringify(qrDataObj)} size={110} />
          </div>
        )}
        <div className="font-bold text-sm tracking-wide">
          {previewInvoice?.scenario === 'TEMELFATURA' || previewInvoice?.scenario === 'TICARIFATURA' ? 'e-Fatura' : 'e-Arşiv Fatura'}
        </div>
      </div>
      
      <div className="text-center mb-4 border-b border-black pb-4 border-dashed">
        <p className="font-bold text-sm">{store.settings?.companyName || "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ"}</p>
        <p>{store.settings?.address || "YENİŞEHİR MAHALLESİ KARDEŞLER CADDE DIŞ KAPI NO: TEKNO KENT ARGE 7 /2 İÇ KAPI NO: B06 MERKEZ / SİVAS"}</p>
        <p>Tel: {store.settings?.phone || "+908506060724"}</p>
        <p>Vergi Dairesi: SİTE VD.</p>
        <p>VKN: 3790894905</p>
      </div>

      <div className="mb-4 border-b border-black pb-4 border-dashed">
        <div className="mb-1"><span className="font-bold">Sayın: </span>{previewInvoice?.customerName}</div>
        <div>{invoiceCustomer?.taxOffice && `${invoiceCustomer.taxOffice} - VKN/TCKN: ${invoiceCustomer.taxNumber || invoiceCustomer.tcNo}`}</div>
        <div className="mt-2">
            <div><span className="font-bold">Fatura Tarihi: </span>{new Date(previewInvoice?.date || new Date()).toLocaleDateString("tr-TR")} {new Date(previewInvoice?.date || new Date()).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div><span className="font-bold">Fatura No: </span>{previewInvoice?.id}</div>
            <div className="break-all"><span className="font-bold">ETTN: </span>{previewInvoice?.id?.toLowerCase()}-e-fatura-ettn</div>
            {(previewInvoice?.orderId || invoiceOrder?.id) && (
                <div><span className="font-bold">Sipariş No: </span>{previewInvoice?.orderId || invoiceOrder?.id}</div>
            )}
            {(previewInvoice?.proposalId || invoiceOrder?.proposalId) && (
                <div><span className="font-bold">Teklif No: </span>{previewInvoice?.proposalId || invoiceOrder?.proposalId}</div>
            )}
        </div>
      </div>

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-black text-left font-bold">
            <th className="py-1">Ürün</th>
            <th className="py-1 text-right">Mik.</th>
            <th className="py-1 text-right">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {invoiceOrder?.items ? (
            invoiceOrder.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-300 border-dashed">
                <td className="py-1 pl-0 pr-1">{item.productName}</td>
                <td className="py-1 text-right">{item.quantity}</td>
                <td className="py-1 text-right pr-0">
                  {((item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100))).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-gray-300 border-dashed">
              <td className="py-1 pl-0 pr-1">Sistem Faturası Hizmet Modülü</td>
              <td className="py-1 text-right">1</td>
              <td className="py-1 text-right pr-0">
                {(previewInvoice?.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="text-right w-full pt-1">
          <div className="flex justify-between items-center mb-1">
            <span>Mal Hizmet Toplam Tutarı:</span>
            <span>{(invoiceOrder?.subTotal || ((previewInvoice?.amount || 0) / 1.2)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span>Hesaplanan KDV Toplamı:</span>
            <span>{(invoiceOrder?.taxTotal || ((previewInvoice?.amount || 0) - ((previewInvoice?.amount || 0) / 1.2))).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-[13px] border-t border-black pt-1 mt-1">
            <span>Ödenecek Tutar:</span>
            <span>{(invoiceOrder?.total || (previewInvoice?.amount || 0)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
          </div>
        </div>
      </div>

      <div className="text-center font-bold mb-4">
        Yalnız: {/* Just a placeholder for written amount */} ---- TL'dir.
      </div>

      <div className="text-center text-[10px] whitespace-pre-line mt-4">
        <p>{store.settings?.invoiceTemplate_notes || "Bu fatura elektronik ortamda Maliye Bakanlığı sistemlerine iletilmiştir."}</p>
        <p className="mt-2 font-bold uppercase tracking-widest text-xs">esila e-fatura</p>
      </div>

    </div>
  );
};
