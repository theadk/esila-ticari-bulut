const fs = require('fs');
let content = fs.readFileSync('pages/HizliSatis.tsx', 'utf8');

// 1. Add useEffect to broadcast state to localStorage
const broadcastEffect = `
  useEffect(() => {
    localStorage.setItem('esila_customer_display_state', JSON.stringify({
      cart: cart.map(c => ({
        id: c.product.id,
        name: c.product.name,
        price: getProductPrice(c.product),
        quantity: c.quantity,
        discount: c.discount
      })),
      total: calculateTotal(),
      customerId: selectedCustomerId
    }));
  }, [cart, selectedCustomerId]);
`;

if (!content.includes('esila_customer_display_state')) {
  content = content.replace(
    'const searchInputRef = useRef<HTMLInputElement>(null);',
    broadcastEffect + '\n  const searchInputRef = useRef<HTMLInputElement>(null);'
  );
}

// 2. Add "Müşteri Ekranı Aç" button
const btnHtml = `
          <button
            onClick={() => window.open('/musteri-ekrani', '_blank', 'width=1024,height=768')}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            title="Müşteri Ekranını Yeni Pencerede Aç"
          >
            <Camera size={20} />
            <span className="hidden sm:inline">Müşteri Ekranı</span>
          </button>
`;

if (!content.includes('Müşteri Ekranı Aç') && !content.includes('/musteri-ekrani')) {
  // Let's insert it into the header next to barcode scanner button maybe
  // Or in the header actions
  content = content.replace(
    /<button\s+onClick=\{[^}]+\}\s+className="flex items-center gap-2 bg-blue-600[^"]+"[^>]*>\s*<Search size=\{20\} \/>\s*<span className="hidden sm:inline">[^<]*<\/span>\s*<\/button>/,
    match => btnHtml + '\n' + match
  );
}

fs.writeFileSync('pages/HizliSatis.tsx', content);
console.log("Patched HizliSatis.tsx");
