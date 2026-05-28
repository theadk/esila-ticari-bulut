import React, { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";
import { Save, Image as ImageIcon, Settings } from "lucide-react";
import toast from "react-hot-toast";

export const InvoiceTemplateEditor: React.FC = () => {
  const store = useAppStore();
  const [formData, setFormData] = useState({
    invoiceTemplate_color: "#059669",
    invoiceTemplate_showQR: true,
    invoiceTemplate_showLogo: true,
    invoiceTemplate_notes:
      "Bu fatura, düzenleme tarihinden itibaren 7 gün içerisinde ödenmelidir. Süresinde ödenmeyen tutarlar için yasal faiz işletilecektir.\nBanka Bilgileri:\nTR50 0021 0000 0013 4303 2000 01",
  });

  useEffect(() => {
    if (store.settings) {
      setFormData({
        invoiceTemplate_color:
          store.settings.invoiceTemplate_color || "#059669",
        invoiceTemplate_showQR: store.settings.invoiceTemplate_showQR !== false,
        invoiceTemplate_showLogo:
          store.settings.invoiceTemplate_showLogo !== false,
        invoiceTemplate_notes:
          store.settings.invoiceTemplate_notes ||
          "Bu fatura, düzenleme tarihinden itibaren 7 gün içerisinde ödenmelidir. Süresinde ödenmeyen tutarlar için yasal faiz işletilecektir.\nBanka Bilgileri:\nTR50 0021 0000 0013 4303 2000 01",
      });
    }
  }, [store.settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    store.setSettings({
      ...(store.settings || {}),
      ...formData,
    });
    toast.success("Şablon ayarları kaydedildi");
  };

  const previewAmount = 6940;

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in mt-6">
      {/* Settings Form */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
        <div className="flex items-center gap-2 mb-6 text-gray-800">
          <Settings size={20} className="text-emerald-600" />
          <h3 className="text-lg font-bold">Şablon Ayarları</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tema Rengi
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={formData.invoiceTemplate_color}
                onChange={(e) =>
                  handleChange("invoiceTemplate_color", e.target.value)
                }
                className="w-10 h-10 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-sm text-gray-500 font-mono uppercase">
                {formData.invoiceTemplate_color}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Görünüm Seçenekleri
            </h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.invoiceTemplate_showLogo}
                onChange={(e) =>
                  handleChange("invoiceTemplate_showLogo", e.target.checked)
                }
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-600">Firma Logosu Göster</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.invoiceTemplate_showQR}
                onChange={(e) =>
                  handleChange("invoiceTemplate_showQR", e.target.checked)
                }
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-600">
                Kare Kod (QR) Göster
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Notlar & Banka Bilgileri
            </label>
            <textarea
              rows={4}
              value={formData.invoiceTemplate_notes}
              onChange={(e) =>
                handleChange("invoiceTemplate_notes", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="Fatura alt notları..."
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
          >
            <Save size={18} />
            Ayarları Kaydet
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="w-full lg:w-2/3 bg-gray-50 p-4 md:p-8 rounded-xl border border-gray-200 overflow-x-auto flex justify-center">
        <div
          className="bg-white p-6 md:p-8 border border-gray-200 shadow-lg w-[210mm] min-h-[297mm] text-[11px] font-sans text-black"
          style={{
            transform: "scale(0.85)",
            transformOrigin: "top center",
            marginBottom: "-10%",
          }}
        >
          {/* Header Row */}
          <div className="flex justify-between items-start mb-4">
            {/* Company Info */}
            <div className="w-[35%]">
              <div
                className="font-bold mb-1"
                style={{ color: formData.invoiceTemplate_color }}
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
              <div className="mb-1">Web Sitesi: www.esilateknoloji.com.tr</div>
              <div className="mb-1">
                E-Posta: {store.settings?.email || "bilgi@e-esila.com"}
              </div>
              <div className="mb-1">
                Vergi Dairesi: SİTE VERGİ DAİRESİ MÜDÜRLÜĞÜ
              </div>
              <div>VKN: 3790894905</div>
            </div>

            {/* GİB Logo */}
            <div className="w-[30%] flex flex-col items-center justify-center">
              <div className="w-24 border text-center p-1 rounded-full aspect-square flex flex-col justify-center items-center font-bold text-red-600 border-red-600 text-[10px]">
                <div>T.C. Hazine ve Maliye Bakanlığı</div>
                <div className="text-3xl font-serif mt-1 mb-1">G</div>
                <div>Gelir İdaresi Başkanlığı</div>
              </div>
              <div className="font-bold text-base mt-2">e-FATURA</div>
            </div>

            {/* QR & Logo */}
            <div className="w-[35%] flex flex-col items-end">
              {formData.invoiceTemplate_showQR && (
                <div className="w-24 h-24 bg-gray-200 mb-2 flex items-center justify-center text-[10px] text-gray-500 border border-gray-300">
                  [QR CODE]
                </div>
              )}
              {formData.invoiceTemplate_showLogo && (
                <div className="text-right">
                  {store.settings?.companyLogo ? (
                    <img
                      src={store.settings?.companyLogo}
                      alt="Logo"
                      className="h-10 ml-auto mb-1"
                    />
                  ) : (
                    <div
                      className="font-serif italic text-2xl font-bold mb-1 text-right"
                      style={{ color: formData.invoiceTemplate_color }}
                    >
                      esila
                    </div>
                  )}
                </div>
              )}
              <div
                className="text-right"
                style={{ color: formData.invoiceTemplate_color }}
              >
                <div className="mb-1">&quot;Ticaretin Bulut Hali&quot;</div>
                <div className="font-bold">www.esila.tr</div>
                <div>+90 850 606 0724</div>
                <div className="font-bold text-[9px]">
                  WhatsApp Destek Hattı : +90 542 66 37452
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Invoice Details Row */}
          <div className="flex justify-between items-start mb-2">
            {/* Customer Info Box */}
            <div className="w-[48%] border border-black p-2">
              <div className="font-bold border-b border-black pb-1 mb-1">
                SAYIN
              </div>
              <div className="font-bold mb-2">Örnek Müşteri A.Ş.</div>
              <div className="mb-1">Merkez / Ankara</div>
              <div className="mb-1">Türkiye</div>
              <div className="mb-1">Vergi Dairesi: ANKARA V.D.</div>
              <div>TCKN/VKN: 11111111111</div>
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
                    <td className="p-1">TICARIFATURA</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1 font-bold border-r border-black">
                      Fatura Tipi:
                    </td>
                    <td className="p-1">SATIS</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1 font-bold border-r border-black">
                      Fatura No:
                    </td>
                    <td className="p-1">ESL2026000002031</td>
                  </tr>
                  <tr>
                    <td className="p-1 font-bold border-r border-black">
                      Fatura Tarihi:
                    </td>
                    <td className="p-1">
                      {new Date().toLocaleDateString("tr-TR")}{" "}
                      {new Date().toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ETTN Row */}
          <div className="font-bold mb-2">
            ETTN:{" "}
            <span className="font-normal text-gray-700">
              be795dfc-d66b-42c5-8e6b-ab07a8896b6b
            </span>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse border border-black mb-4">
            <thead
              style={{ backgroundColor: formData.invoiceTemplate_color + "1A" }}
            >
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
              <tr className="border-b border-black">
                <td className="p-1 border-r border-black text-center">1</td>
                <td className="p-1 border-r border-black">1K</td>
                <td className="p-1 border-r border-black">
                  Muhtelif Ürün / Hizmet Satışı
                </td>
                <td className="p-1 border-r border-black text-right">1 Adet</td>
                <td className="p-1 border-r border-black text-right">
                  {(previewAmount / 1.2).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  TL
                </td>
                <td className="p-1 border-r border-black text-right">%20,00</td>
                <td className="p-1 border-r border-black text-right">
                  {(previewAmount - previewAmount / 1.2).toLocaleString(
                    "tr-TR",
                    { minimumFractionDigits: 2 },
                  )}{" "}
                  TL
                </td>
                <td className="p-1 border-r border-black text-right"></td>
                <td className="p-1 text-right">
                  {(previewAmount / 1.2).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  TL
                </td>
              </tr>
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
                      {(previewAmount / 1.2).toLocaleString("tr-TR", {
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
                      0,00 TL
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1 font-bold border-r border-black">
                      Hesaplanan GERÇEK USULDE KDV(%20)
                    </td>
                    <td className="p-1 border-l-2 border-black border-l-gray-300">
                      {(previewAmount - previewAmount / 1.2).toLocaleString(
                        "tr-TR",
                        { minimumFractionDigits: 2 },
                      )}{" "}
                      TL
                    </td>
                  </tr>
                  <tr className="border-b border-black bg-gray-50">
                    <td className="p-1 font-bold border-r border-black">
                      Vergiler Dahil Toplam Tutar
                    </td>
                    <td className="p-1 border-l-2 border-black border-l-gray-300">
                      {previewAmount.toLocaleString("tr-TR", {
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
                      {previewAmount.toLocaleString("tr-TR", {
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
            {formData.invoiceTemplate_notes?.split("\n").map((line, i) => (
              <div key={i} className="font-bold">
                {line ? `Not: ${line}` : ""}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border border-black p-2 flex font-bold text-[10px]">
            <div
              className="w-1/2 border-r border-black pr-2"
              style={{ color: formData.invoiceTemplate_color }}
            >
              {store.settings?.companyName ||
                "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ"}
            </div>
            <div className="w-1/2 pl-2 text-right opacity-75">
              Bu bir şablon önizlemesidir
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
