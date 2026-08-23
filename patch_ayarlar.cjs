const fs = require('fs');

let code = fs.readFileSync('pages/Ayarlar.tsx', 'utf8');

const uploadHelper = `
const uploadImageToServer = async (base64String: string): Promise<string> => {
  const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ imageBase64: base64String })
  });
  if (!res.ok) throw new Error('Resim sunucuya yüklenemedi.');
  const data = await res.json();
  return data.url;
};
`;

if (!code.includes('uploadImageToServer')) {
  code = code.replace(
    'const handleSave = () => {',
    uploadHelper + '\n  const handleSave = () => {'
  );
}

code = code.replace(
  `      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleChange('companyLogo', base64String);
      };`,
  `      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const serverUrl = await uploadImageToServer(base64String);
          handleChange('companyLogo', serverUrl);
        } catch(e) {
          alert('Logo yüklenemedi.');
        }
      };`
);

fs.writeFileSync('pages/Ayarlar.tsx', code);
console.log('Patched Ayarlar.tsx');
