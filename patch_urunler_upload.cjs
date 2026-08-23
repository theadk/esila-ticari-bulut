const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

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
    'const resizeImage = (file: File)',
    uploadHelper + '\nconst resizeImage = (file: File)'
  );
}

// Replace the normal file upload onChange
code = code.replace(
  `                              const resized = await resizeImage(file);\n                              setFormData({...formData, image: resized});`,
  `                              const resized = await resizeImage(file);\n                              const serverUrl = await uploadImageToServer(resized);\n                              setFormData({...formData, image: serverUrl});`
);

// Replace the capture file upload onChange
code = code.replace(
  `                              const resized = await resizeImage(file);\n                              setFormData({...formData, image: resized});`,
  `                              const resized = await resizeImage(file);\n                              const serverUrl = await uploadImageToServer(resized);\n                              setFormData({...formData, image: serverUrl});`
);

fs.writeFileSync('pages/Urunler.tsx', code);
console.log('Patched Urunler.tsx');
