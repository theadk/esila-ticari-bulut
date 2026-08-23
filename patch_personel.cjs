const fs = require('fs');
let code = fs.readFileSync('pages/Personel.tsx', 'utf8');

if (!code.includes('import { EmployeePortal }')) {
  code = code.replace(
    'import { PuantajMaasView } from "../components/PuantajMaasView";',
    'import { PuantajMaasView } from "../components/PuantajMaasView";\nimport { EmployeePortal } from "../components/EmployeePortal";'
  );
}

const unauthBlock = `  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <User size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Personel modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }`;

const replacement = `  if (!canView) {
    return <EmployeePortal currentUser={currentUser} />;
  }`;

if (code.includes(unauthBlock)) {
  code = code.replace(unauthBlock, replacement);
  fs.writeFileSync('pages/Personel.tsx', code);
  console.log('patched Personel.tsx unauthBlock');
} else {
  console.log('unauthBlock not found or already patched');
}
