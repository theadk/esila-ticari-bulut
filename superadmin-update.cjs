const fs = require('fs');

function updateSuperAdmin() {
  let file = 'src/pages/SuperAdminDashboard.tsx';
  let code = fs.readFileSync(file, 'utf8');

  // 1. Add sector to interface
  code = code.replace("password?: string;\n}", "password?: string;\n  sector?: string;\n}");

  code = code.replace(/vkn: '', name: '', email: '', package: 'Yıllık',/g, "vkn: '', name: '', email: '', package: 'Yıllık', sector: '',");
  
  // 3. Add handleResetPassword
  const resetFunc = `
  const handleResetPassword = async (vkn: string) => {
    if (confirm("Bu firmanın yönetici şifresi sıfırlanacak ve e-posta ile gönderilecektir. Onaylıyor musunuz?")) {
      try {
        const res = await fetch(\`/api/tenants/\${vkn}/reset-password\`, { method: 'POST' });
        if (res.ok) {
           const data = await res.json();
           alert(\`Şifre sıfırlandı: \${data.password}\\nYeni şifre firmaya e-posta ile iletildi.\`);
           fetchTenants();
        } else {
           alert("Hata oluştu.");
        }
      } catch(e) {
        alert("Hata oluştu.");
      }
    }
  };
`;
  if(!code.includes("handleResetPassword")) {
    code = code.replace("const handleActivate =", resetFunc + "\n  const handleActivate =");
  }

  // Add state for filters inside component
  const filterStates = `
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const filteredTenants = tenants.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (sectorFilter && t.sector !== sectorFilter) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!t.name.toLowerCase().includes(lower) && !t.vkn.includes(lower) && !t.email.toLowerCase().includes(lower)) return false;
    }
    return true;
  });

  const sectoralData = tenants.reduce((acc: any, t) => {
     const sec = t.sector || 'Belirtilmemiş';
     acc[sec] = (acc[sec] || 0) + 1;
     return acc;
  }, {});
`;
  if(!code.includes("const [searchTerm, setSearchTerm]")) {
    code = code.replace("const MODULES =", filterStates + "\n  const MODULES =");
  }

  // Update map to use filteredTenants
  code = code.replace(/\{tenants\.map\(t => \(/g, "{filteredTenants.map(t => (");
  code = code.replace(/tenants\.length === 0/g, "filteredTenants.length === 0");

  const filterUI = `
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200 col-span-1 md:col-span-4 grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium ml-1">Firma / VKN Ara</label>
              <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Ara..." className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium ml-1">Sektöre Göre Filtrele</label>
              <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Tümü</option>
                {Object.keys(sectoralData).map(sec => (
                  <option key={sec} value={sec}>{sec} ({sectoralData[sec]})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium ml-1">Duruma Göre Filtrele</label>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Tümü</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
                <option value="Bekliyor">Bekliyor</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {Object.entries(sectoralData).sort((a:any, b:any) => b[1] - a[1]).slice(0, 5).map(([sec, count]) => (
            <div key={sec} className="bg-white p-4 rounded-xl shadow border border-gray-200">
               <div className="text-xs text-gray-500 font-medium mb-1 truncate">{sec}</div>
               <div className="text-2xl font-bold text-gray-800">{count as number} <span className="text-sm font-normal text-gray-500">firma</span></div>
            </div>
          ))}
        </div>
`;

  code = code.replace(
    '<div className="flex justify-between items-center mb-6">',
     filterUI + '\n        <div className="flex justify-between items-center mb-6">'
  );

  // Edit forms
  const sectorEdit = `
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sektör</label>
                    <select value={formData.sector || ''} onChange={e=>setFormData({...formData, sector: e.target.value})} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                      <option value="">Seçiniz</option>
                      <option value="Bilişim & Teknoloji">Bilişim & Teknoloji</option>
                      <option value="Perakende & Mağazacılık">Perakende & Mağazacılık</option>
                      <option value="Toptan Ticaret">Toptan Ticaret</option>
                      <option value="Üretim & İmalat">Üretim & İmalat</option>
                      <option value="Gıda & Tarım">Gıda & Tarım</option>
                      <option value="İnşaat & Yapı">İnşaat & Yapı</option>
                      <option value="Eğitim & Danışmanlık">Eğitim & Danışmanlık</option>
                      <option value="Sağlık & Medikal">Sağlık & Medikal</option>
                      <option value="Otomotiv & Lojistik">Otomotiv & Lojistik</option>
                      <option value="Hizmet & Diğer">Hizmet & Diğer</option>
                    </select>
                  </div>`;
                  
  code = code.replace(/<div>\s*<label className="text-sm font-medium text-gray-700">Lisans Paketi \*<\/label>/, sectorEdit + '\n                   <div>\n                    <label className="text-sm font-medium text-gray-700">Lisans Paketi *</label>');

  // Also handle edit logic to update `sector: tenant.sector`
  code = code.replace(
    /email: tenant\.email,/g,
    "email: tenant.email,\n      sector: tenant.sector,"
  );

  // Also password reset action button
  const resetBtn = `
                     <div className="mt-2">
                        <button onClick={() => handleResetPassword(t.vkn)} className="text-gray-500 hover:text-gray-800 hover:underline text-xs flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                          Yeni Şifre Gönder
                        </button>
                     </div>`;
                     
  code = code.replace(/<td className="p-4 font-mono text-xs font-bold text-gray-600">\s*\{t\.password \|\| '\*\*\*\*\*'\}\s*<\/td>/, `<td className="p-4 font-mono text-xs font-bold text-gray-600">\n                    {t.password || '*****'}\n${resetBtn}\n                  </td>`);

  fs.writeFileSync(file, code);
}
updateSuperAdmin();
