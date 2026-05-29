const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

const newHeader = `                {/* Header Row */}
                <div className="flex justify-between items-start mb-4 gap-2">
                  {(store.settings?.invoiceTemplate_layoutOrder || ['info', 'gib', 'logo']).map((blockKey, idx) => {
                    const alignmentClass = idx === 0 ? 'items-start text-left' : idx === 1 ? 'items-center text-center justify-center' : 'items-end text-right';
                    
                    if (blockKey === 'info') {
                      return (
                        <div key="info" className={\`w-[33%] flex flex-col \${alignmentClass}\`}>
                          <div className="font-bold mb-1" style={{ color: store.settings?.invoiceTemplate_color || "#059669" }}>{store.settings?.companyName || "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ"}</div>
                          <div className="mb-1">{store.settings?.address || "YENİŞEHİR MAHALLESİ KARDEŞLER CADDE DIŞ KAPI NO: TEKNO KENT ARGE 7 /2 İÇ KAPI NO: B06 MERKEZ / SİVAS"}</div>
                          <div className="mb-1">58100 Sivas Merkez/ Sivas</div>
                          <div className="mb-1">Tel: {store.settings?.phone || "+908506060724"}</div>
                          <div className="mb-1">Web Sitesi: www.esilateknoloji.com.tr</div>
                          <div className="mb-1">E-Posta: {store.settings?.email || "bilgi@e-esila.com"}</div>
                          <div className="mb-1">Vergi Dairesi: SİTE VERGİ DAİRESİ MÜDÜRLÜĞÜ</div>
                          <div>VKN: 3790894905</div>
                        </div>
                      );
                    }
                    if (blockKey === 'gib') {
                      return (
                        <div key="gib" className={\`w-[33%] flex flex-col \${alignmentClass}\`}>
                          <div className="w-24 border text-center p-1 rounded-full aspect-square flex flex-col justify-center items-center font-bold text-red-600 border-red-600 text-[10px]">
                            <div>T.C. Hazine ve Maliye Bakanlığı</div>
                            <div className="text-3xl font-serif mt-1 mb-1">G</div>
                            <div>Gelir İdaresi Başkanlığı</div>
                          </div>
                          <div className="font-bold text-base mt-2 flex justify-center w-full">e-FATURA</div>
                        </div>
                      );
                    }
                    if (blockKey === 'logo') {
                      return (
                        <div key="logo" className={\`w-[33%] flex flex-col \${alignmentClass}\`}>
                          {store.settings?.invoiceTemplate_showQR !== false && (
                            <div className="w-24 h-24 bg-gray-200 mb-2 flex items-center justify-center text-[10px] text-gray-500 border border-gray-300">
                              [QR CODE]
                            </div>
                          )}
                          {store.settings?.invoiceTemplate_showLogo !== false && (
                            <div className={\`w-full \${idx === 0 ? 'border-t pt-2 mt-2 text-left' : idx === 1 ? 'border-t pt-2 mt-2 text-center' : 'border-t pt-2 mt-2 text-right'}\`} style={{ borderColor: (store.settings?.invoiceTemplate_color || "#059669") + "40" }}>
                              {store.settings?.invoiceTemplate_logoUrl ? (
                                <img src={store.settings?.invoiceTemplate_logoUrl} alt="Logo" className={\`h-10 mb-1 \${idx === 0 ? 'mr-auto' : idx === 1 ? 'mx-auto' : 'ml-auto'}\`} />
                              ) : store.settings?.companyLogo ? (
                                <img src={store.settings?.companyLogo} alt="Logo" className={\`h-10 mb-1 \${idx === 0 ? 'mr-auto' : idx === 1 ? 'mx-auto' : 'ml-auto'}\`} />
                              ) : (
                                <div className={\`font-serif italic text-2xl font-bold mb-1 \${idx === 0 ? 'text-left' : idx === 1 ? 'text-center' : 'text-right'}\`} style={{ color: store.settings?.invoiceTemplate_color || "#059669" }}>esila</div>
                              )}
                              <div className="mb-1" style={{ color: store.settings?.invoiceTemplate_color || "#059669" }}>&quot;Ticaretin Bulut Hali&quot;</div>
                              <div className="font-bold" style={{ color: store.settings?.invoiceTemplate_color || "#059669" }}>www.esila.tr</div>
                              <div style={{ color: store.settings?.invoiceTemplate_color || "#059669" }}>+90 850 606 0724</div>
                              <div className="font-bold text-[9px]" style={{ color: store.settings?.invoiceTemplate_color || "#059669" }}>WhatsApp Destek Hattı : +90 542 66 37452</div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>`;

const startIdx = code.indexOf('{/* Header Row */}');
const endIdx = code.indexOf('{/* Customer & Invoice Details Row */}');

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newHeader + '\n\n                ' + code.substring(endIdx);
  
  // also replace Banks in EFatura.tsx
  const targetNotes = '{/* Notes */}';
  const targetFooter = '{/* Footer */}';
  const notesStart = code.indexOf(targetNotes);
  const notesEnd = code.indexOf(targetFooter);
  
  const newNotes = `{/* Notes */}
                <div className="border border-black p-2 mb-4 text-[10px] whitespace-pre-wrap">
                  {store.settings?.invoiceTemplate_notes ? (
                    store.settings.invoiceTemplate_notes.split('\\n').map((line, i) => (
                      <div key={i} className="font-bold">{line ? \`Not: \${line}\` : ''}</div>
                    ))
                  ) : (
                    <>
                      <div className="font-bold">Not: "Bu fatura, düzenleme tarihinden itibaren 7 gün içerisinde ödenmelidir. Süresinde ödenmeyen tutarlar için 6102 sayılı TTK ve 6098 sayılı TBK kapsamında yasal faiz işletilecektir."</div>
                      <div className="font-bold">Not: 4000 TL HAVALE YAPILMIŞTIR. KALAN BAKİYE 2940TL'DİR</div>
                      <div className="font-bold">Not: Yalnız #--- TL#</div>
                    </>
                  )}
                  {store.settings?.invoiceTemplate_banks && store.settings.invoiceTemplate_banks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-black border-dashed">
                      <div className="font-bold mb-1 underline mt-1">BANKA HESAP BİLGİLERİMİZ</div>
                      {store.settings.invoiceTemplate_banks.map((b, i) => (
                         <div key={i} className="font-bold">
                           Banka: {b.bankName} | Alıcı: {b.accountName} | IBAN: {b.iban}
                         </div>
                      ))}
                    </div>
                  )}
                </div>`;
                
  if (notesStart !== -1 && notesEnd !== -1) {
    code = code.substring(0, notesStart) + newNotes + '\\n\\n                ' + code.substring(notesEnd);
  }
  
  fs.writeFileSync('pages/EFatura.tsx', code);
  console.log('Replaced Header Row & Banks!');
} else {
  console.log('Indexes not found', startIdx, endIdx);
}
