const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Import CustomerDisplay
if (!content.includes('import { CustomerDisplay }')) {
  content = content.replace(
    "import { EFatura } from './pages/EFatura';",
    "import { EFatura } from './pages/EFatura';\nimport { CustomerDisplay } from './pages/CustomerDisplay';"
  );
}

// Add route
const customerDisplayRoute = `
  if (window.location.pathname.startsWith('/musteri-ekrani')) {
    return <CustomerDisplay />;
  }
`;
if (!content.includes('/musteri-ekrani')) {
  content = content.replace(
    '  if (publicFormToken) {',
    customerDisplayRoute + '\n  if (publicFormToken) {'
  );
}

fs.writeFileSync('App.tsx', content);
console.log("Patched App.tsx");
