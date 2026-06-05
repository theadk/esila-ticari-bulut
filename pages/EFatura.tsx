import React, { useState, useEffect } from "react";
import { ThermalEArsiv } from "./ThermalEArsiv";
import { QRCodeSVG } from "qrcode.react";
import {
  FileText,
  FileJson,
  Download,
  Send,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Printer,
  Eye,
  X,
} from "lucide-react";
import { useAppStore } from "../lib/store";
import { InvoiceTemplateEditor } from "../components/InvoiceTemplateEditor";
import { Pagination } from "../components/Pagination";

export const EFatura: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<"Taslak" | "Giden" | "Şablon">(
    "Taslak",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [printType, setPrintType] = useState<'A4' | '80mm'>('A4');

  const invoices = store.eInvoices || [];

  const [isQuerying, setIsQuerying] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Giden" && !hasQueried) {
      setHasQueried(true);
      const needsQuery = invoices.filter((inv) => ['Gönderildi', 'Bekliyor'].includes(inv.status));
      if (needsQuery.length > 0) {
        handleQueryStatus(true);
      }
    }
  }, [activeTab, invoices, hasQueried]);

  const handleQueryStatus = (silent = false) => {
    const needsQuery = invoices.filter((inv) => ['Gönderildi', 'Bekliyor'].includes(inv.status));
    if (needsQuery.length === 0) {
      if (!silent) alert("Sorgulanacak faturanız bulunmamaktadır.");
      return;
    }
    setIsQuerying(true);
    setTimeout(() => {
      const updated = invoices.map((inv) => {
        if (['Gönderildi', 'Bekliyor'].includes(inv.status)) {
            // Rastgele yeni bir durum belirle
            const random = Math.random();
            let newStatus = 'Bekliyor';
            if (random > 0.6) newStatus = 'Onaylandı';
            else if (random > 0.9) newStatus = 'Reddedildi';
            return { ...inv, status: newStatus as any };
        }
        return inv;
      });
      if (store.setEInvoices) store.setEInvoices(updated);
      setIsQuerying(false);
      if (!silent) alert(`${needsQuery.length} adet faturanın son durumu GİB'den güncellendi.`);
    }, 1500);
  };


  const filtered = invoices.filter((inv) => {
    if (activeTab === "Taslak") return inv.status === "Taslak";
    if (activeTab === "Giden") return inv.status !== "Taslak";
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = itemsPerPage === -1 ? filtered : filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleSendToPortal = (invId: string) => {
    const updated = invoices.map((i) =>
      i.id === invId ? { ...i, status: "Gönderildi" } : i,
    );
    if (store.setEInvoices) store.setEInvoices(updated);
    alert("Fatura başarıyla e-Dönüşüm portalına iletildi.");
  };

  const handleBulkSend = () => {
    if (selectedIds.length === 0) return;
    const updated = invoices.map((i) =>
      selectedIds.includes(i.id) && i.status === "Taslak"
        ? { ...i, status: "Gönderildi" }
        : i,
    );
    if (store.setEInvoices) store.setEInvoices(updated);
    alert(`${selectedIds.length} adet fatura başarıyla portala iletildi.`);
    setSelectedIds([]);
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    alert(`${selectedIds.length} adet faturanın PDF çıktıları hazırlanıyor...`);
    // Simulated PDF print delay
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleBulkJSONDownload = () => {
    if (selectedIds.length === 0) return;
    const selectedInvoices = invoices.filter((i) => selectedIds.includes(i.id));

    const gibJson = selectedInvoices.map((inv) => {
        const order = store.orders?.find((o) => o.id === inv.orderId);
        const customer = store.customers?.find((c) => c.name === inv.customerName || c.id === order?.customerId);
        
        return {
            "GIB_UBL_TR": {
                "Invoice": {
                    "ID": inv.id,
                    "IssueDate": new Date(inv.date).toISOString().split('T')[0],
                    "InvoiceTypeCode": inv.type,
                    "ProfileID": inv.scenario,
                    "DocumentCurrencyCode": "TRY",
                    "AccountingSupplierParty": {
                        "Party": {
                            "PartyName": { "Name": store.settings.companyName || "Şirket Adı" },
                            "PartyTaxScheme": { "TaxScheme": { "Name": "VD" }, "CompanyID": store.settings.vkn || "1111111111" }
                        }
                    },
                    "AccountingCustomerParty": {
                        "Party": {
                            "PartyName": { "Name": inv.customerName },
                            "PartyTaxScheme": { "TaxScheme": { "Name": customer?.taxOffice || "Müşteri VD" }, "CompanyID": customer?.taxNumber || "2222222222" }
                        }
                    },
                    "LegalMonetaryTotal": {
                        "LineExtensionAmount": inv.amount,
                        "TaxExclusiveAmount": inv.amount,
                        "TaxInclusiveAmount": inv.amount,
                        "PayableAmount": inv.amount
                    },
                    "InvoiceLine": order?.items.map((item, idx) => ({
                        "ID": (idx + 1).toString(),
                        "InvoicedQuantity": item.quantity,
                        "LineExtensionAmount": item.price * item.quantity,
                        "Item": { "Name": item.productName }
                    })) || []
                }
            }
        };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gibJson, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `gib_efatura_export_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const invoiceOrder = previewInvoice
    ? store.orders?.find((o) => o.id === previewInvoice.orderId)
    : null;
  const invoiceCustomer = previewInvoice
    ? store.customers?.find(
        (c) =>
          c.name === previewInvoice.customerName ||
          (invoiceOrder && c.id === invoiceOrder.customerId),
      )
    : null;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center sm:flex-row flex-col">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            E-Fatura & E-Arşiv
          </h2>
          <p className="text-gray-500 text-sm">
            Düzenlenen ve taslak aşamasındaki e-Fatura/e-Arşiv belgelerinizi
            yönetin
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab("Taslak")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Taslak" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
          >
            Taslaklar
          </button>
          <button
            onClick={() => setActiveTab("Giden")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Giden" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
          >
            Giden Kutusu
          </button>
          <button
            onClick={() => setActiveTab("Şablon")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Şablon" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
          >
            Şablon Düzenleyici
          </button>
        </div>
        {activeTab === "Giden" && (
            <div className="flex ml-4 mt-4 sm:mt-0 items-center justify-end">
              <button
                onClick={() => handleQueryStatus(false)}
                disabled={isQuerying}
                className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Clock size={16} /> {isQuerying ? 'GİB Sorgulanıyor...' : 'GİB Durum Sorgula'}
              </button>
            </div>
        )}
      </div>

      {activeTab === "Şablon" ? (
        <InvoiceTemplateEditor />
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 flex-1 overflow-hidden flex flex-col">
          {selectedIds.length > 0 && (
            <div className="bg-blue-50/50 border-b border-blue-100 p-3 flex justify-between items-center px-4 animate-fade-in no-print">
              <div className="text-sm font-medium text-blue-800">
                <span className="font-bold">{selectedIds.length}</span> fatura
                seçildi
              </div>
              <div className="flex gap-2">
                {activeTab === "Taslak" && (
                  <button
                    onClick={handleBulkSend}
                    className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Send size={14} /> Toplu GİB'e Gönder
                  </button>
                )}
                <button
                  onClick={handleBulkPrint}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Printer size={14} /> Toplu PDF İndir
                </button>
                <button
                  onClick={handleBulkJSONDownload}
                  className="px-3 py-1.5 bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                >
                  <FileJson size={14} /> GİB JSON İndir
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      checked={
                        selectedIds.length === filtered.length &&
                        filtered.length > 0
                      }
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? filtered.map((i) => i.id) : [],
                        )
                      }
                    />
                  </th>
                  <th className="p-4 font-medium">Tarih</th>
                  <th className="p-4 font-medium">Belge No / Ref</th>
                  <th className="p-4 font-medium">Müşteri</th>
                  <th className="p-4 font-medium">Senaryo / Tür</th>
                  <th className="p-4 font-medium text-right">Tutar</th>
                  <th className="p-4 font-medium text-center">Durum</th>
                  <th className="p-4 font-medium text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Bu sekmede gösterilecek bir fatura bulunamadı.
                    </td>
                  </tr>
                ) : (
                  paginated.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          checked={selectedIds.includes(inv.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, inv.id]
                                : prev.filter((id) => id !== inv.id),
                            )
                          }
                        />
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(inv.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {inv.id}
                        <div className="text-xs font-normal text-gray-500">
                          Sipariş: {inv.orderId}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {inv.customerName}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="font-medium text-gray-700">
                          {inv.type}
                        </span>
                        <div className="text-xs text-gray-500">
                          {inv.scenario}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-right text-gray-800">
                        {inv.amount.toLocaleString("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        })}
                      </td>
                      <td className="p-4 text-center">
                        {inv.status === "Taslak" && (
                          <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium border border-yellow-200">
                            <Clock size={12} /> Taslak
                          </span>
                        )}
                        {(inv.status === "Gönderildi" || inv.status === "Bekliyor") && (
                          <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium border border-orange-200">
                            <Clock size={12} /> GİB'de Bekliyor
                          </span>
                        )}
                        {inv.status === "Onaylandı" && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium border border-green-200">
                            <CheckCircle size={12} /> GİB Onaylı
                          </span>
                        )}
                        {inv.status === "Reddedildi" && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium border border-red-200">
                            <X size={12} /> Reddedildi
                          </span>
                        )}
                        {inv.status === "Hatalı" && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium border border-red-200">
                            <X size={12} /> Hatalı
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="px-2 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                            title="Önizleme"
                          >
                            <Eye size={16} />
                          </button>
                          {inv.status === "Taslak" ? (
                            <button
                              onClick={() => handleSendToPortal(inv.id)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                            >
                              <Send size={14} /> GİB'e Gönder
                            </button>
                          ) : (
                            <div className="flex gap-1 items-center">
                              <button 
                                onClick={() => {
                                  setSelectedIds([inv.id]);
                                  setTimeout(handleBulkJSONDownload, 50);
                                }}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="GİB JSON İndir">
                                <FileJson size={16} />
                              </button>
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                                <MoreHorizontal size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={filtered.length}
          />
        </div>
      )}

      {/* Önizleme Modalı */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col no-print">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  E-Fatura Önizlemesi
                </h3>
                <p className="text-sm text-gray-500">
                  Belge No: {previewInvoice.id}
                </p>
              </div>
              
              {/* Optional: Layout Type Toggle if you want to switch between A4 and 80mm */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPrintType('A4')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${printType === 'A4' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  A4
                </button>
                <button
                  onClick={() => setPrintType('80mm')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${printType === '80mm' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  80mm
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Printer size={16} /> Yazdır / PDF
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 print:p-0 print:bg-white flex justify-center">
              {printType === 'A4' ? (
                <div
                  className="bg-white p-8 border border-gray-200 shadow-sm mx-auto max-w-[210mm] min-h-[297mm] text-[11px] font-sans text-black print:border-none print:shadow-none print:m-0"
                  id="invoice-preview"
                >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4 gap-2">
                  {(
                    store.settings?.invoiceTemplate_layoutOrder || [
                      "info",
                      "gib",
                      "logo",
                    ]
                  ).map((blockKey, idx) => {
                    const alignmentClass =
                      idx === 0
                        ? "items-start text-left"
                        : idx === 1
                          ? "items-center text-center justify-center"
                          : "items-end text-right";

                    if (blockKey === "info") {
                      return (
                        <div
                          key="info"
                          className={`w-[33%] flex flex-col ${alignmentClass}`}
                        >
                          <div
                            className="font-bold mb-1"
                            style={{
                              color:
                                store.settings?.invoiceTemplate_color ||
                                "#059669",
                            }}
                          >
                            {store.settings?.companyName ||
                              "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ"}
                          </div>
                          <div className="mb-1">
                            {store.settings?.address ||
                              "YENİŞEHİR MAHALLESİ KARDEŞLER CADDE DIŞ KAPI NO: TEKNO KENT ARGE 7 /2 İÇ KAPI NO: B06 MERKEZ / SİVAS"}
                          </div>
                          <div className="mb-1">58100 Sivas Merkez/ Sivas</div>
                          <div className="mb-1">
                            Tel: {store.settings?.phone || "+908506060724"}
                          </div>
                          <div className="mb-1">
                            Web Sitesi: www.esilateknoloji.com.tr
                          </div>
                          <div className="mb-1">
                            E-Posta:{" "}
                            {store.settings?.email || "bilgi@e-esila.com"}
                          </div>
                          <div className="mb-1">
                            Vergi Dairesi: SİTE VERGİ DAİRESİ MÜDÜRLÜĞÜ
                          </div>
                          <div>VKN: 3790894905</div>
                        </div>
                      );
                    }
                    if (blockKey === "gib") {
                      return (
                        <div
                          key="gib"
                          className={`w-[33%] flex flex-col ${alignmentClass} items-center`}
                        >
                          <img 
                            src="/gib-logo.png" 
                            alt="GİB Logo" 
                            className="w-24 object-contain mix-blend-multiply flex-shrink-0" 
                          />
                          <div className="font-bold text-base mt-2 flex justify-center w-full uppercase">
                            {previewInvoice?.scenario === 'TEMELFATURA' || previewInvoice?.scenario === 'TICARIFATURA' ? 'e-Fatura' : 'e-Arşiv Fatura'}
                          </div>
                        </div>
                      );
                    }
                    if (blockKey === "logo") {
                      return (
                        <div
                          key="logo"
                          className={`w-[33%] flex flex-col ${alignmentClass}`}
                        >
                          {store.settings?.invoiceTemplate_showQR !== false && (
                            <div className="mb-2">
                              {(() => {
                                let qrDate = "2026-01-03";
                                try {
                                  qrDate = new Date(previewInvoice.date).toISOString().split('T')[0];
                                } catch(e) {}
                                
                                const qrDataObj = {
                                  vkntckn: store.settings?.companyVkn || "3790894905",
                                  avkntckn: invoiceCustomer?.taxNumber || invoiceCustomer?.tcNo || "0100359315",
                                  senaryo: previewInvoice.scenario || "EARSIVFATURA",
                                  tip: previewInvoice.type || "SATIS",
                                  tarih: qrDate,
                                  no: previewInvoice.id || "ESI2026000002001",
                                  ettn: previewInvoice.id ? `${previewInvoice.id.toLowerCase()}-e-fatura-ettn` : "e9baec5d-f923-4f06-894b-e3de911a16c2",
                                  parabirimi: "TRY",
                                  "malhizmettoplam": (invoiceOrder?.subTotal || (previewInvoice.amount / 1.2)).toFixed(2),
                                  "kdvmatrah(20)": (invoiceOrder?.subTotal || (previewInvoice.amount / 1.2)).toFixed(2),
                                  "hesaplanankdv(20)": (invoiceOrder?.taxTotal || (previewInvoice.amount - previewInvoice.amount / 1.2)).toFixed(2),
                                  vergidahil: (invoiceOrder?.total || previewInvoice.amount).toFixed(2),
                                  odenecek: (invoiceOrder?.total || previewInvoice.amount).toFixed(2)
                                };
                                return <QRCodeSVG value={JSON.stringify(qrDataObj)} size={96} />;
                              })()}
                            </div>
                          )}
                          {store.settings?.invoiceTemplate_showLogo !==
                            false && (
                            <div
                              className={`w-full ${idx === 0 ? "border-t pt-2 mt-2 text-left" : idx === 1 ? "border-t pt-2 mt-2 text-center" : "border-t pt-2 mt-2 text-right"}`}
                              style={{
                                borderColor:
                                  (store.settings?.invoiceTemplate_color ||
                                    "#059669") + "40",
                              }}
                            >
                              {store.settings?.invoiceTemplate_logoUrl ? (
                                <img
                                  src={store.settings?.invoiceTemplate_logoUrl}
                                  alt="Logo"
                                  className={`h-10 mb-1 ${idx === 0 ? "mr-auto" : idx === 1 ? "mx-auto" : "ml-auto"}`}
                                />
                              ) : store.settings?.companyLogo ? (
                                <img
                                  src={store.settings?.companyLogo}
                                  alt="Logo"
                                  className={`h-10 mb-1 ${idx === 0 ? "mr-auto" : idx === 1 ? "mx-auto" : "ml-auto"}`}
                                />
                              ) : (
                                <div
                                  className={`font-serif italic text-2xl font-bold mb-1 ${idx === 0 ? "text-left" : idx === 1 ? "text-center" : "text-right"}`}
                                  style={{
                                    color:
                                      store.settings?.invoiceTemplate_color ||
                                      "#059669",
                                  }}
                                >
                                  esila
                                </div>
                              )}
                              <div
                                className="mb-1"
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                &quot;Ticaretin Bulut Hali&quot;
                              </div>
                              <div
                                className="font-bold"
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                www.esila.tr
                              </div>
                              <div
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                +90 850 606 0724
                              </div>
                              <div
                                className="font-bold text-[9px]"
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                WhatsApp Destek Hattı : +90 542 66 37452
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                {/* Customer & Invoice Details Row */}
                <div className="flex justify-between items-start mb-2">
                  {/* Customer Info Box */}
                  <div className="w-[48%] border border-black p-2">
                    <div className="font-bold border-b border-black pb-1 mb-1">
                      SAYIN
                    </div>
                    <div className="font-bold mb-2">
                      {previewInvoice.customerName}
                    </div>
                    <div className="mb-1">
                      {invoiceCustomer?.city
                        ? `${invoiceCustomer.district || ""} / ${invoiceCustomer.city}`
                        : "Merkez / Yozgat"}
                    </div>
                    <div className="mb-1">Türkiye</div>
                    <div className="mb-1">
                      Vergi Dairesi:{" "}
                      {invoiceCustomer?.taxOffice ||
                        "YOZGAT VERGİ DAİRESİ MÜD."}
                    </div>
                    <div>
                      TCKN/VKN:{" "}
                      {invoiceCustomer?.taxNumber ||
                        invoiceCustomer?.tcNo ||
                        "11111111111"}
                    </div>
                  </div>

                  {/* Invoice Details Box */}
                  <div className="w-[48%] border border-black p-0">
                    <table className="w-full text-left">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold w-1/3 border-r border-black">
                            Özelleştirme No:
                          </td>
                          <td className="p-1">TR1.2</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Senaryo:
                          </td>
                          <td className="p-1">
                            {previewInvoice.scenario || "TICARIFATURA"}
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Fatura Tipi:
                          </td>
                          <td className="p-1">
                            {previewInvoice.type || "SATIS"}
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Fatura No:
                          </td>
                          <td className="p-1">{previewInvoice.id}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Fatura Tarihi:
                          </td>
                          <td className="p-1">
                            {new Date(previewInvoice.date).toLocaleDateString(
                              "tr-TR",
                            )}{" "}
                            {new Date(previewInvoice.date).toLocaleTimeString(
                              "tr-TR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </td>
                        </tr>
                        {(previewInvoice.orderId || invoiceOrder?.id) && (
                          <tr className="border-b border-black">
                            <td className="p-1 font-bold border-r border-black">
                              Sipariş No:
                            </td>
                            <td className="p-1">{previewInvoice.orderId || invoiceOrder?.id}</td>
                          </tr>
                        )}
                        {(previewInvoice.proposalId || invoiceOrder?.proposalId) && (
                          <tr>
                            <td className="p-1 font-bold border-r border-black">
                              Teklif No:
                            </td>
                            <td className="p-1">{previewInvoice.proposalId || invoiceOrder?.proposalId}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* ETTN Row */}
                <div className="font-bold mb-2">
                  ETTN:{" "}
                  <span className="font-normal text-gray-700">
                    {previewInvoice.id.toLowerCase()}-e-fatura-ettn
                  </span>
                </div>
                {/* Items Table */}
                <table className="w-full text-left border-collapse border border-black mb-4">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="p-1 border-r border-black w-8">
                        Sıra
                        <br />
                        No
                      </th>
                      <th className="p-1 border-r border-black w-12">
                        Ürün
                        <br />
                        Kodu
                      </th>
                      <th className="p-1 border-r border-black">Mal Hizmet</th>
                      <th className="p-1 border-r border-black text-right w-16">
                        Miktar
                      </th>
                      <th className="p-1 border-r border-black text-right w-24">
                        Birim Fiyat
                      </th>
                      <th className="p-1 border-r border-black text-right w-16">
                        KDV Oranı
                      </th>
                      <th className="p-1 border-r border-black text-right w-20">
                        KDV Tutarı
                      </th>
                      <th className="p-1 border-r border-black text-right w-20">
                        Diğer Vergiler
                      </th>
                      <th className="p-1 text-right w-24">
                        Mal Hizmet
                        <br />
                        Tutarı
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceOrder &&
                    invoiceOrder.items &&
                    invoiceOrder.items.length > 0 ? (
                      invoiceOrder.items.map((item: any, idx: number) => {
                        const taxRate = item.taxRate || 20;
                        const priceWithoutTax =
                          item.price / (1 + taxRate / 100);
                        const taxAmount = item.price - priceWithoutTax;
                        const totalItemWithoutTax =
                          priceWithoutTax * item.quantity;

                        return (
                          <tr
                            key={idx}
                            className="border-b border-black last:border-b-0"
                          >
                            <td className="p-1 border-r border-black text-center">
                              {idx + 1}
                            </td>
                            <td className="p-1 border-r border-black">
                              {item.productId || "1K"}
                            </td>
                            <td className="p-1 border-r border-black">
                              {item.productName}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {item.quantity} {item.unit || "Adet"}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {priceWithoutTax.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}{" "}
                              TL
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              %{taxRate}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {(taxAmount * item.quantity).toLocaleString(
                                "tr-TR",
                                { minimumFractionDigits: 2 },
                              )}{" "}
                              TL
                            </td>
                            <td className="p-1 border-r border-black text-right"></td>
                            <td className="p-1 text-right">
                              {totalItemWithoutTax.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              TL
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-b border-black">
                        <td className="p-1 border-r border-black text-center">
                          1
                        </td>
                        <td className="p-1 border-r border-black">1K</td>
                        <td className="p-1 border-r border-black">
                          Muhtelif Ürün / Hizmet Satışı
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          1 Adet
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          {(previewInvoice.amount / 1.2).toLocaleString(
                            "tr-TR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 8,
                            },
                          )}{" "}
                          TL
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          %20,00
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          {(
                            previewInvoice.amount -
                            previewInvoice.amount / 1.2
                          ).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          TL
                        </td>
                        <td className="p-1 border-r border-black text-right"></td>
                        <td className="p-1 text-right">
                          {(previewInvoice.amount / 1.2).toLocaleString(
                            "tr-TR",
                            { minimumFractionDigits: 2 },
                          )}{" "}
                          TL
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Totals Box */}
                <div className="flex justify-end mb-4">
                  <div className="w-[45%]">
                    <table className="w-full text-right border-collapse border border-black">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Mal Hizmet Toplam Tutarı
                          </td>
                          <td className="p-1 w-32 border-l-2 border-black border-l-gray-300">
                            {(
                              invoiceOrder?.subTotal ||
                              previewInvoice.amount / 1.2
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Toplam İskonto
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(
                              (invoiceOrder as any)?.discountTotal || 0
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Hesaplanan KDV Toplamı
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(
                              invoiceOrder?.taxTotal ||
                              previewInvoice.amount -
                                previewInvoice.amount / 1.2
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black bg-gray-50">
                          <td className="p-1 font-bold border-r border-black">
                            Vergiler Dahil Toplam Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(
                              invoiceOrder?.total || previewInvoice.amount
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black font-bold">
                          <td className="p-1 border-r border-black">
                            Ödenecek Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(
                              invoiceOrder?.total || previewInvoice.amount
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Notes */}
                <div className="border border-black p-2 mb-4 text-[10px] whitespace-pre-wrap">
                  {store.settings?.invoiceTemplate_notes ? (
                    store.settings.invoiceTemplate_notes
                      .split("\n")
                      .map((line, i) => (
                        <div key={i} className="font-bold">
                          {line ? `Not: ${line}` : ""}
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="font-bold">
                        Not: "Bu fatura, düzenleme tarihinden itibaren 7 gün
                        içerisinde ödenmelidir. Süresinde ödenmeyen tutarlar
                        için 6102 sayılı TTK ve 6098 sayılı TBK kapsamında yasal
                        faiz işletilecektir."
                      </div>
                      <div className="font-bold">
                        Not: 4000 TL HAVALE YAPILMIŞTIR. KALAN BAKİYE 2940TL'DİR
                      </div>
                      <div className="font-bold">Not: Yalnız #--- TL#</div>
                    </>
                  )}
                  {store.settings?.invoiceTemplate_banks &&
                    store.settings.invoiceTemplate_banks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-black border-dashed">
                        <div className="font-bold mb-1 underline mt-1">
                          BANKA HESAP BİLGİLERİMİZ
                        </div>
                        {store.settings.invoiceTemplate_banks.map((b, i) => (
                          <div key={i} className="font-bold">
                            Banka: {b.bankName} | Alıcı: {b.accountName} | IBAN:{" "}
                            {b.iban}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                \n\n {/* Footer */}
                <div className="border border-black p-2 flex font-bold text-[10px]">
                  <div
                    className="w-1/2 border-r border-black pr-2"
                    style={{
                      color: store.settings?.invoiceTemplate_color || "#059669",
                    }}
                  >
                    {store.settings?.companyName ||
                      "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ"}
                  </div>
                  <div className="w-1/2 pl-2">
                    {store.settings?.invoiceTemplate_notes?.includes("IBAN")
                      ? ""
                      : "IBAN: TR50 0021 0000 0013 4303 2000 01"}
                  </div>
                </div>
              </div>
              ) : (
                <ThermalEArsiv previewInvoice={previewInvoice} invoiceOrder={invoiceOrder} store={store} invoiceCustomer={invoiceCustomer} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
