const fs = require('fs');
let code = fs.readFileSync('pages/Ajanda.tsx', 'utf8');

// 1. Add "ShoppingCart" and "CalendarPlus" (Wait, CalendarPlus might not be imported, let's just use ShoppingCart) to imports if they aren't there.
const importRegex = /import \{ Calendar, Search, Filter, CheckCircle, Circle, Trash2, CalendarDays, TrendingUp, DollarSign, PlusCircle, X, Mic, MicOff \} from 'lucide-react';/;
code = code.replace(
  importRegex, 
  "import { Calendar, Search, Filter, CheckCircle, Circle, Trash2, CalendarDays, TrendingUp, DollarSign, PlusCircle, X, Mic, MicOff, ShoppingCart } from 'lucide-react';"
);

// 2. Add handleImportOrders function
const funcToInsert = `
  const handleImportOrders = () => {
    const pendingOrders = store.orders.filter(o => 
      o.status !== 'Teslim Edildi' && 
      o.status !== 'İptal'
    );
    
    let addedCount = 0;
    const newNotes = [...(store.reminderNotes || [])];

    pendingOrders.forEach(order => {
      // Look for a target date (expectedDeliveryDate or order date)
      const targetDate = order.expectedDeliveryDate || order.date.split('T')[0];
      
      // Check if already exists (prevent duplicates based on order ID)
      const title = \`Sipariş Teslimatı: \${order.customerName}\`;
      const exists = newNotes.some(note => note.title === title && note.date === targetDate);
      
      if (!exists) {
        newNotes.push({
          id: \`NOTE-ORDER-\${order.id}-\${Date.now()}\`,
          title,
          description: \`Sipariş Tutarı: \${order.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}\nSipariş No: #\${order.id.substring(0,8).toUpperCase()}\`,
          type: 'Satış',
          date: targetDate,
          isCompleted: false,
          notificationSent: false
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      store.setReminderNotes(newNotes);
      toast.success(\`\${addedCount} adet sipariş takvime aktarıldı.\`);
    } else {
      toast.error('Aktarılacak yeni sipariş bulunamadı.');
    }
  };
`;

// Insert it right before "const handleSaveNote"
code = code.replace(
  "const handleSaveNote = () => {",
  funcToInsert + "\n  const handleSaveNote = () => {"
);

// 3. Add the button
const buttonHtml = `
          {canCreate && (
             <button 
                onClick={handleImportOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mr-2"
                title="Siparişten Takvime Aktar"
             >
                <ShoppingCart size={20} />
                <span className="hidden sm:inline">Siparişleri Aktar</span>
             </button>
          )}
`;
code = code.replace(
  "{canCreate && (\n          <button \n             onClick={() => {",
  buttonHtml + "{canCreate && (\n          <button \n             onClick={() => {"
);

fs.writeFileSync('pages/Ajanda.tsx', code);
